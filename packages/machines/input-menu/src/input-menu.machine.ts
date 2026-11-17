import { createMachine } from "@code-ui/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-ui/form/context";
import { isEqual, isNotEmpty, isNotNull } from "@code-ui/utils";
import { defaultInputMenuProps } from "./input-menu.props";
import type {
  InputMenuMachine,
  InputMenuScalarValue,
  InputMenuSchema,
  InputMenuValue,
} from "./input-menu.types";
import {
  filterDropdownItems,
  hasSelectedInputMenuValue,
  isOptionSelected,
  normalizeDropdownItems,
  normalizeInputMenuValue,
  resolveCreateItemConfig,
  resolveDisplayLabel,
  resolveSelectedTags,
} from "./input-menu.utils";

const DEFAULT_CLOSE_DURATION = 150;
const CLOSE_RESET_BUFFER_MS = 40;

const closedTransitions = {
  OPEN: {
    guard: "isInteractive" as const,
    target: "open" as const,
    actions: ["invokeOnOpen" as const],
  },
  TOGGLE: {
    guard: "isInteractive" as const,
    target: "open" as const,
    actions: ["invokeOnOpen" as const],
  },
  "TRIGGER.TAP": [
    {
      guard: "shouldOpenOnClick" as const,
      target: "open" as const,
      actions: ["setFocusedTrue" as const, "invokeOnOpen" as const],
    },
    {
      guard: "isInteractive" as const,
      actions: ["setFocusedTrue" as const],
    },
  ],
  FOCUS: [
    {
      guard: "shouldOpenOnFocus" as const,
      target: "open" as const,
      actions: ["setFocusedTrue" as const, "invokeOnOpen" as const],
    },
    {
      guard: "isInteractive" as const,
      actions: ["setFocusedTrue" as const],
    },
  ],
  INPUT: [
    {
      guard: "shouldOpenOnInput" as const,
      target: "open" as const,
      actions: ["updateSearchTerm" as const, "invokeOnOpen" as const],
    },
    {
      guard: "isInteractive" as const,
      actions: ["updateSearchTerm" as const],
    },
  ],
  SELECT_ITEM: {
    guard: "canSelectDropdownItem" as const,
    actions: ["selectItem" as const],
  },
};

const closingReopenTransitions = {
  OPEN: {
    guard: "isInteractive" as const,
    target: "open" as const,
    actions: ["resetSearchOnClosed" as const, "invokeOnOpen" as const],
  },
  TOGGLE: {
    guard: "isInteractive" as const,
    target: "open" as const,
    actions: ["resetSearchOnClosed" as const, "invokeOnOpen" as const],
  },
  "TRIGGER.TAP": [
    {
      guard: "shouldOpenOnClick" as const,
      target: "open" as const,
      actions: [
        "resetSearchOnClosed" as const,
        "setFocusedTrue" as const,
        "invokeOnOpen" as const,
      ],
    },
    {
      guard: "isInteractive" as const,
      actions: ["setFocusedTrue" as const],
    },
  ],
  FOCUS: [
    {
      guard: "shouldOpenOnFocus" as const,
      target: "open" as const,
      actions: [
        "resetSearchOnClosed" as const,
        "setFocusedTrue" as const,
        "invokeOnOpen" as const,
      ],
    },
    {
      guard: "isInteractive" as const,
      actions: ["setFocusedTrue" as const],
    },
  ],
  INPUT: [
    {
      guard: "shouldOpenOnInput" as const,
      target: "open" as const,
      actions: [
        "resetSearchOnClosed" as const,
        "updateSearchTerm" as const,
        "invokeOnOpen" as const,
      ],
    },
    {
      guard: "isInteractive" as const,
      actions: ["updateSearchTerm" as const],
    },
  ],
  SELECT_ITEM: closedTransitions.SELECT_ITEM,
};

export const inputMenuMachine: InputMenuMachine =
  createMachine<InputMenuSchema>({
    props: ({ props }) => ({
      ...defaultInputMenuProps,
      ...props,
    }),

    initialState: ({ prop }) => {
      const rawOpen = prop("open");
      const isOpen = isNotNull(rawOpen)
        ? Boolean(rawOpen)
        : Boolean(prop("defaultOpen"));
      return isOpen ? "open" : "closed";
    },

    refs: ({ prop, context, computed, send }) => {
      const multiple = Boolean(prop("multiple"));
      const rawVal = prop("value");
      const rawDefault = prop("defaultValue");
      const initial = isNotNull(rawVal)
        ? normalizeInputMenuValue(rawVal, multiple)
        : normalizeInputMenuValue(rawDefault, multiple);

      return {
        initialValue: initial,
        formField: undefined,
        groupContext: {
          value: () => context.get("value"),
          multiple: () => Boolean(prop("multiple")),
          disabled: () => computed("isDisabled"),
          searchTerm: () => computed("effectiveSearchTerm"),
          isSelected: (val: InputMenuScalarValue) =>
            isOptionSelected(
              val,
              context.get("value"),
              Boolean(prop("multiple")),
            ),
          isChildIndexVisible: (groupIndex: number) =>
            computed("filteredItems").some((it) => it.rawIndex === groupIndex),
          select: (val: InputMenuScalarValue) =>
            send({ type: "SELECT_ITEM", value: val }),
        },
      };
    },

    context: ({ prop, bindable, getRefs }) => ({
      value: bindable<InputMenuValue>(() => {
        const multiple = Boolean(prop("multiple"));
        const rawVal = prop("value");
        const controlledVal = isNotNull(rawVal)
          ? normalizeInputMenuValue(rawVal, multiple)
          : undefined;
        const defaultVal = normalizeInputMenuValue(
          prop("defaultValue"),
          multiple,
        );

        return {
          value: controlledVal,
          defaultValue: controlledVal ?? defaultVal,
          isEqual,
          onChange: (nextVal) => {
            const items = normalizeDropdownItems(
              prop("items"),
              prop("childItems"),
              prop("valueKey"),
              prop("labelKey"),
              prop("descriptionKey"),
              prop("disabledKey"),
              prop("filterFields"),
            );

            if (Array.isArray(nextVal)) {
              const matched = nextVal
                .map((v) =>
                  items.find(
                    (it) => it.type === "item" && isEqual(it.value, v),
                  ),
                )
                .filter((it): it is NonNullable<typeof it> => Boolean(it));
              prop("onChange")?.({
                value: nextVal,
                item: matched[0],
                items: matched,
              });
            } else {
              const matched =
                nextVal !== null
                  ? items.find(
                      (it) => it.type === "item" && isEqual(it.value, nextVal),
                    )
                  : undefined;
              prop("onChange")?.({
                value: nextVal,
                item: matched,
                items: matched ? [matched] : [],
              });
            }

            const formField = getRefs().get("formField");
            if (formField) {
              formField.emitInput(nextVal);
              formField.emitChange(nextVal);
            }
          },
        };
      }),

      searchTerm: bindable<string>(() => {
        const rawSearch = prop("searchTerm");
        return {
          value: isNotNull(rawSearch) ? String(rawSearch) : undefined,
          defaultValue: prop("defaultSearchTerm") ?? "",
          onChange: (nextSearch) => {
            prop("onSearchTermChange")?.({ searchTerm: nextSearch });
          },
        };
      }),

      isFiltering: bindable<boolean>(() => ({
        defaultValue: false,
      })),

      focused: bindable<boolean>(() => ({
        defaultValue: false,
      })),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),
    }),

    computed: {
      ...createFormFieldComputed("input-menu"),
      isInvalid: ({ prop, refs, context, scope }) =>
        Boolean(
          context.get("invalid") ||
            hasFormFieldErrors(prop, refs, scope, "input-menu"),
        ),
      isDisabled: ({ prop, computed }) =>
        Boolean(
          computed("formDisabled") ||
            computed("fieldDisabled") ||
            prop("disabled"),
        ),
      isReadOnly: ({ prop, computed }) =>
        Boolean(prop("readOnly") || computed("formReadOnly")),
      isInteractive: ({ computed }) =>
        !computed("isDisabled") && !computed("isReadOnly"),
      isOpen: ({ state }) => state.hasTag("open"),
      isVisible: ({ state }) => state.hasTag("open") || state.hasTag("closing"),

      normalizedItems: ({ prop }) =>
        normalizeDropdownItems(
          prop("items"),
          prop("childItems"),
          prop("valueKey"),
          prop("labelKey"),
          prop("descriptionKey"),
          prop("disabledKey"),
          prop("filterFields"),
        ),

      effectiveSearchTerm: ({ context, prop }) => {
        if (prop("multiple") || isNotNull(prop("searchTerm"))) {
          return context.get("searchTerm");
        }
        return context.get("isFiltering") ? context.get("searchTerm") : "";
      },

      filteredItems: ({ computed, prop }) =>
        filterDropdownItems(
          computed("normalizedItems"),
          computed("effectiveSearchTerm"),
          Boolean(prop("ignoreFilter")),
        ),

      selectedTags: ({ context, computed, prop }) =>
        resolveSelectedTags(
          context.get("value"),
          Boolean(prop("multiple")),
          computed("normalizedItems"),
        ),

      displayLabel: ({ context, computed, prop }) =>
        resolveDisplayLabel(
          context.get("value"),
          Boolean(prop("multiple")),
          computed("normalizedItems"),
        ),

      inputValue: ({ context, computed, prop, state }) => {
        if (prop("multiple")) {
          return context.get("searchTerm");
        }
        if (isNotNull(prop("searchTerm"))) {
          return context.get("searchTerm");
        }
        if (state.hasTag("open") && context.get("isFiltering")) {
          return context.get("searchTerm");
        }
        return computed("displayLabel");
      },

      hasValue: ({ context, computed }) =>
        hasSelectedInputMenuValue(
          context.get("value"),
          computed("normalizedItems"),
        ),

      isClearable: ({ prop, computed, context }) =>
        Boolean(
          prop("clearable") &&
            computed("isInteractive") &&
            (computed("hasValue") || context.get("searchTerm").length > 0),
        ),

      showCreateItem: ({ prop, computed, context }) => {
        if (!computed("isInteractive")) return false;
        const cfg = resolveCreateItemConfig(prop("createItem"));
        if (!cfg.enabled) return false;
        const query = context.get("searchTerm").trim();
        if (!query) return false;

        const normalized = computed("normalizedItems");
        const hasExactMatch = normalized.some(
          (it) =>
            it.type === "item" &&
            it.label.trim().toLowerCase() === query.toLowerCase(),
        );
        if (hasExactMatch) return false;

        if (cfg.when === "always") return true;
        const selectableMatches = computed("filteredItems").some(
          (it) => it.type === "item",
        );
        return !selectableMatches;
      },

      createItemPosition: ({ prop }) =>
        resolveCreateItemConfig(prop("createItem")).position,
    },

    entry: ["setupFormField"],
    exit: ["cleanupFormField"],

    watch: ({ prop, state }) => {
      const rawOpen = prop("open");
      if (!isNotNull(rawOpen)) return;

      const shouldBeOpen = Boolean(rawOpen);
      const isCurrentlyOpen = state.hasTag("open");
      if (shouldBeOpen && !isCurrentlyOpen) {
        state.set("open");
      } else if (!shouldBeOpen && isCurrentlyOpen) {
        state.set("closing");
      }
    },

    on: {
      SET_VALUE: {
        guard: "isInteractive",
        actions: ["setValue"],
      },
      SET_SEARCH_TERM: {
        guard: "isInteractive",
        actions: ["setSearchTerm"],
      },
      REMOVE_TAG: {
        guard: "canRemoveTag",
        actions: ["removeTag"],
      },
      CLEAR_VALUE: {
        guard: "isInteractive",
        actions: ["clearValue"],
      },
      RESET_VALUE: {
        target: "closed",
        actions: ["resetValue"],
      },
      BLUR: {
        actions: ["setFocusedFalse"],
      },
    },

    states: {
      closed: {
        tags: ["closed"],
        on: {
          ...closedTransitions,
          CONFIRM: {
            guard: "isInteractive",
            actions: ["handleConfirm"],
          },
        },
      },

      open: {
        tags: ["open"],
        on: {
          CLOSE: {
            target: "closing",
            actions: ["blurOnClose", "invokeOnClose"],
          },
          TOGGLE: {
            target: "closing",
            actions: ["blurOnClose", "invokeOnClose"],
          },
          "BACKDROP.TAP": {
            target: "closing",
            guard: "closeOnBackdropClick",
            actions: ["blurOnClose", "invokeOnClose"],
          },
          FOCUS: {
            guard: "isInteractive",
            actions: ["setFocusedTrue"],
          },
          INPUT: {
            guard: "isInteractive",
            actions: ["updateSearchTerm"],
          },
          SELECT_ITEM: [
            {
              guard: "shouldCloseAfterSelect",
              target: "closing",
              actions: ["selectItemOnClose", "blurOnClose", "invokeOnClose"],
            },
            {
              guard: "canSelectDropdownItem",
              actions: ["selectItem"],
            },
          ],
          CREATE_ITEM: [
            {
              guard: "shouldCloseAfterCreate",
              target: "closing",
              actions: ["createItemOnClose", "blurOnClose", "invokeOnClose"],
            },
            {
              guard: "canCreateItem",
              actions: ["createItem"],
            },
          ],
          CONFIRM: [
            {
              guard: "shouldCloseOnConfirm",
              target: "closing",
              actions: ["handleConfirmOnClose", "blurOnClose", "invokeOnClose"],
            },
            {
              guard: "isInteractive",
              actions: ["handleConfirm"],
            },
          ],
        },
      },

      closing: {
        tags: ["closing"],
        effects: ["waitForCloseAnimation"],
        on: {
          ANIMATION_END: {
            target: "closed",
            actions: ["resetSearchOnClosed"],
          },
          ...closingReopenTransitions,
        },
      },
    },

    implementations: {
      guards: {
        isInteractive: ({ computed }) => computed("isInteractive"),
        shouldOpenOnFocus: ({ computed, prop }) =>
          computed("isInteractive") && Boolean(prop("openOnFocus")),
        shouldOpenOnClick: ({ computed, prop }) =>
          computed("isInteractive") && Boolean(prop("openOnClick")),
        shouldOpenOnInput: ({ computed, prop }) =>
          computed("isInteractive") && Boolean(prop("openOnInput")),
        closeOnBackdropClick: ({ prop }) => Boolean(prop("closeOnBackdropClick")),
        canSelectDropdownItem: ({ computed, event }) => {
          if (!computed("isInteractive") || event.type !== "SELECT_ITEM") {
            return false;
          }
          const item = computed("normalizedItems").find(
            (it) => it.type === "item" && isEqual(it.value, event.value),
          );
          return item ? !item.disabled : true;
        },
        shouldCloseAfterSelect: ({ prop, computed, event }) => {
          if (!computed("isInteractive") || event.type !== "SELECT_ITEM") {
            return false;
          }
          const item = computed("normalizedItems").find(
            (it) => it.type === "item" && isEqual(it.value, event.value),
          );
          if (item?.disabled) return false;
          const explicitClose = prop("closeOnSelect");
          return isNotNull(explicitClose)
            ? Boolean(explicitClose)
            : !prop("multiple");
        },
        canRemoveTag: ({ computed, prop, event }) => {
          if (
            !computed("isInteractive") ||
            !prop("multiple") ||
            event.type !== "REMOVE_TAG"
          ) {
            return false;
          }
          const item = computed("normalizedItems").find(
            (it) => it.type === "item" && isEqual(it.value, event.value),
          );
          return item ? !item.disabled : true;
        },
        canCreateItem: ({ computed }) =>
          computed("isInteractive") && computed("showCreateItem"),
        shouldCloseAfterCreate: ({ prop, computed }) => {
          if (!computed("isInteractive") || !computed("showCreateItem")) {
            return false;
          }
          const explicitClose = prop("closeOnSelect");
          return isNotNull(explicitClose)
            ? Boolean(explicitClose)
            : !prop("multiple");
        },
        shouldCloseOnConfirm: ({ prop, computed, context }) => {
          if (!computed("isInteractive")) return false;
          const explicitClose = prop("closeOnSelect");
          const closeAfter = isNotNull(explicitClose)
            ? Boolean(explicitClose)
            : !prop("multiple");
          if (!closeAfter) return false;
          if (computed("showCreateItem")) return true;
          const hasQuery = context.get("searchTerm").trim().length > 0;
          const firstMatch = computed("filteredItems").find(
            (it) => it.type === "item" && !it.disabled,
          );
          return Boolean(hasQuery && firstMatch);
        },
      },

      actions: {
        setupFormField: ({ context, prop, refs, scope, computed, action }) => {
          setupFormFieldSync(
            {
              component: prop("component"),
              getHost: () => prop("formContext"),
              id: scope.id ?? "input-menu",
              getFormId: () => prop("form") || "",
              getName: () => prop("name") || "",
              getValue: () => context.get("value"),
              setValue: (rawVal: unknown) => {
                const nextVal = normalizeInputMenuValue(
                  rawVal as InputMenuValue,
                  Boolean(prop("multiple")),
                );
                context.set("value", nextVal);
              },
              resetValue: () => {
                action(["resetValue"]);
              },
              getRules: () => prop("rules") ?? [],
              getValidateOn: () => prop("validateOn"),
              isDisabled: () => computed("isDisabled"),
            },
            refs,
          );
        },

        cleanupFormField: ({ refs }) => {
          cleanupFormFieldSync(refs);
        },

        invokeOnOpen: ({ prop }) => {
          prop("onOpenChange")?.({ open: true });
        },

        invokeOnClose: ({ prop }) => {
          prop("onOpenChange")?.({ open: false });
        },

        setFocusedTrue: ({ context, prop, refs }) => {
          if (context.get("focused")) return;
          context.set("focused", true);
          const val = context.get("value");
          refs.get("formField")?.emitFocus(val);
          prop("onFocus")?.({
            value: val,
            searchTerm: context.get("searchTerm"),
          });
        },

        setFocusedFalse: ({ context, prop, refs, state }) => {
          context.set("focused", false);
          if (state.matches("closed") && prop("resetSearchTermOnBlur")) {
            context.set("isFiltering", false);
            context.set("searchTerm", "");
          }
          const val = context.get("value");
          refs.get("formField")?.emitBlur(val);
          prop("onBlur")?.({
            value: val,
            searchTerm: context.get("searchTerm"),
          });
        },

        blurOnClose: ({ context }) => {
          context.set("focused", false);
        },

        resetSearchOnClosed: ({ context, prop }) => {
          if (prop("resetSearchTermOnBlur") || prop("resetSearchTermOnSelect")) {
            context.set("isFiltering", false);
            if (prop("resetSearchTermOnBlur")) {
              context.set("searchTerm", "");
            }
          }
        },

        updateSearchTerm: ({ context, event }) => {
          if (event.type !== "INPUT") return;
          context.set("isFiltering", true);
          context.set("searchTerm", event.value);
        },

        setSearchTerm: ({ context, event }) => {
          if (event.type !== "SET_SEARCH_TERM") return;
          context.set("isFiltering", event.searchTerm.length > 0);
          context.set("searchTerm", event.searchTerm);
        },

        selectItemOnClose: ({ context, computed, prop, event }) => {
          if (event.type !== "SELECT_ITEM") return;
          const val = event.value;
          const item = computed("normalizedItems").find(
            (it) => it.type === "item" && isEqual(it.value, val),
          );
          const multiple = Boolean(prop("multiple"));

          if (multiple) {
            const current = context.get("value");
            const list = Array.isArray(current) ? [...current] : [];
            const existingIdx = list.findIndex((entry) => isEqual(entry, val));
            const selected = existingIdx === -1;
            if (selected) {
              list.push(val);
            } else {
              list.splice(existingIdx, 1);
            }
            prop("onSelect")?.({ value: val, item, selected });
            context.set("value", list);
          } else {
            prop("onSelect")?.({ value: val, item, selected: true });
            context.set("value", val);
          }
        },

        selectItem: ({ context, prop, event, action }) => {
          action(["selectItemOnClose"]);
          if (event.type !== "SELECT_ITEM") return;
          context.set("isFiltering", false);
          if (prop("resetSearchTermOnSelect")) {
            context.set("searchTerm", "");
          }
        },

        removeTag: ({ context, computed, prop, event }) => {
          if (event.type !== "REMOVE_TAG" || !prop("multiple")) return;
          const val = event.value;
          const current = context.get("value");
          const list = Array.isArray(current) ? [...current] : [];
          const existingIdx = list.findIndex((entry) => isEqual(entry, val));
          if (existingIdx === -1) return;

          const item = computed("normalizedItems").find(
            (it) => it.type === "item" && isEqual(it.value, val),
          );
          list.splice(existingIdx, 1);
          prop("onSelect")?.({ value: val, item, selected: false });
          context.set("value", list);
        },

        createItemOnClose: ({ context, prop }) => {
          const query = context.get("searchTerm").trim();
          if (!query) return;
          prop("onCreate")?.({ value: query });
        },

        createItem: ({ context, prop, action }) => {
          action(["createItemOnClose"]);
          context.set("isFiltering", false);
          if (prop("resetSearchTermOnSelect")) {
            context.set("searchTerm", "");
          }
        },

        handleConfirmOnClose: ({ context, computed, prop, action }) => {
          const firstMatch = computed("filteredItems").find(
            (it) => it.type === "item" && !it.disabled,
          );
          const query = context.get("searchTerm").trim();

          if (computed("showCreateItem") && !firstMatch) {
            action(["createItemOnClose"]);
            return;
          }

          if (query && firstMatch) {
            const val = firstMatch.value;
            const multiple = Boolean(prop("multiple"));
            if (multiple) {
              const current = context.get("value");
              const list = Array.isArray(current) ? [...current] : [];
              if (!list.some((entry) => isEqual(entry, val))) {
                list.push(val);
                prop("onSelect")?.({
                  value: val,
                  item: firstMatch,
                  selected: true,
                });
                context.set("value", list);
              }
            } else {
              prop("onSelect")?.({
                value: val,
                item: firstMatch,
                selected: true,
              });
              context.set("value", val);
            }
            return;
          }

          if (computed("showCreateItem")) {
            action(["createItemOnClose"]);
          }
        },

        handleConfirm: ({ context, prop, action }) => {
          action(["handleConfirmOnClose"]);
          context.set("isFiltering", false);
          if (prop("resetSearchTermOnSelect")) {
            context.set("searchTerm", "");
          }
        },

        setValue: ({ context, prop, event }) => {
          if (event.type !== "SET_VALUE") return;
          context.set(
            "value",
            normalizeInputMenuValue(event.value, Boolean(prop("multiple"))),
          );
        },

        clearValue: ({ context, prop }) => {
          context.set("value", prop("multiple") ? [] : null);
          context.set("isFiltering", false);
          context.set("searchTerm", "");
          prop("onClear")?.({});
        },

        resetValue: ({ context, prop, refs }) => {
          const initial =
            refs.get("initialValue") ??
            normalizeInputMenuValue(
              prop("defaultValue"),
              Boolean(prop("multiple")),
            );
          context.set("value", initial);
          context.set("isFiltering", false);
          context.set("searchTerm", prop("defaultSearchTerm") ?? "");
          context.set("invalid", false);
        },
      },

      effects: {
        waitForCloseAnimation: ({ send, prop }) => {
          let cancelled = false;
          const explicitDuration = prop("duration");
          const baseDelay =
            typeof explicitDuration === "number" && explicitDuration >= 0
              ? explicitDuration
              : DEFAULT_CLOSE_DURATION;
          const delay = baseDelay + CLOSE_RESET_BUFFER_MS;

          const timer = setTimeout(() => {
            if (!cancelled) {
              send({ type: "ANIMATION_END" });
            }
          }, delay);

          return () => {
            cancelled = true;
            clearTimeout(timer);
          };
        },
      },
    },
  });
