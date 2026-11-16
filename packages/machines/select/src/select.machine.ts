import { createMachine } from "@code-ui/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-ui/form/context";
import { isEqual, isNotEmpty, isNotNull } from "@code-ui/utils";
import { defaultSelectProps } from "./select.props";
import type {
  SelectMachine,
  SelectPickerColumnItem,
  SelectScalarValue,
  SelectSchema,
  SelectValue,
} from "./select.types";
import {
  clampAndSnapPickerIndices,
  hasSelectedSelectValue,
  isOptionSelected,
  normalizeDropdownItems,
  normalizePickerColumns,
  normalizeSelectValue,
  resolvePickerIndicesFromValue,
  resolveSelectedLabels,
} from "./select.utils";

const DEFAULT_CLOSE_DURATION = 150;

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
  SELECT_ITEM: {
    guard: "canSelectDropdownItem" as const,
    actions: ["selectItem" as const],
  },
};

export const selectMachine: SelectMachine = createMachine<SelectSchema>({
  props: ({ props }) => ({
    ...defaultSelectProps,
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
      ? normalizeSelectValue(rawVal, multiple)
      : normalizeSelectValue(rawDefault, multiple);

    return {
      initialValue: initial,
      formField: undefined,
      groupContext: {
        value: () => context.get("value"),
        multiple: () => Boolean(prop("multiple")),
        disabled: () => computed("isDisabled"),
        isSelected: (val) =>
          isOptionSelected(val, context.get("value"), Boolean(prop("multiple"))),
        select: (val) => send({ type: "SELECT_ITEM", value: val }),
      },
    };
  },

  context: ({ prop, bindable, getRefs }) => ({
    value: bindable<SelectValue>(() => {
      const multiple = Boolean(prop("multiple"));
      const rawVal = prop("value");
      const controlledVal = isNotNull(rawVal)
        ? normalizeSelectValue(rawVal, multiple)
        : undefined;
      const defaultVal = normalizeSelectValue(prop("defaultValue"), multiple);

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
          );

          if (Array.isArray(nextVal)) {
            const matched = nextVal
              .map((v) =>
                items.find((it) => it.type === "item" && isEqual(it.value, v)),
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

    invalid: bindable<boolean>(() => {
      const rawInvalid = prop("invalid");
      return {
        value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
        defaultValue: false,
      };
    }),

    pendingIndices: bindable<number[]>(() => ({
      defaultValue: [],
      isEqual,
    })),
  }),

  computed: {
    ...createFormFieldComputed("select"),
    isInvalid: ({ prop, refs, context, scope }) =>
      Boolean(
        context.get("invalid") ||
          hasFormFieldErrors(prop, refs, scope, "select"),
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
      ),

    pickerColumns: ({ prop }) =>
      normalizePickerColumns(
        prop("items"),
        prop("childItems"),
        prop("valueKey"),
        prop("labelKey"),
        prop("descriptionKey"),
        prop("disabledKey"),
      ),

    selectedLabels: ({ context, computed, prop }) =>
      resolveSelectedLabels(
        context.get("value"),
        prop("mode"),
        Boolean(prop("multiple")),
        computed("normalizedItems"),
        computed("pickerColumns"),
      ),

    displayLabel: ({ computed }) => computed("selectedLabels").join(", "),

    hasValue: ({ context, computed }) =>
      hasSelectedSelectValue(
        context.get("value"),
        computed("normalizedItems"),
      ),

    isClearable: ({ prop, computed }) =>
      Boolean(
        prop("clearable") && computed("isInteractive") && computed("hasValue"),
      ),
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  watch: ({ prop, state, track }) => {
    track([() => prop("open")], () => {
      const rawOpen = prop("open");
      if (!isNotNull(rawOpen)) return;

      const shouldBeOpen = Boolean(rawOpen);
      const isCurrentlyOpen = state.hasTag("open");
      if (shouldBeOpen && !isCurrentlyOpen) {
        state.set("open");
      } else if (!shouldBeOpen && isCurrentlyOpen) {
        state.set("closing");
      }
    });
  },

  on: {
    SET_VALUE: {
      guard: "isInteractive",
      actions: ["setValue", "syncPickerDraft"],
    },
    CLEAR_VALUE: {
      guard: "isInteractive",
      actions: ["clearValue"],
    },
    RESET_VALUE: {
      target: "closed",
      actions: ["resetValue"],
    },
  },

  states: {
    closed: {
      tags: ["closed"],
      on: closedTransitions,
    },

    open: {
      tags: ["open"],
      entry: ["syncPickerDraft", "emitFocus"],
      on: {
        CLOSE: {
          target: "closing",
          actions: ["invokeOnClose", "emitBlur"],
        },
        TOGGLE: {
          target: "closing",
          actions: ["invokeOnClose", "emitBlur"],
        },
        "BACKDROP.TAP": {
          target: "closing",
          guard: "closeOnBackdropClick",
          actions: ["emitPickerCancelBackdrop", "invokeOnClose", "emitBlur"],
        },
        SELECT_ITEM: [
          {
            guard: "shouldCloseAfterSelect",
            target: "closing",
            actions: ["selectItem", "invokeOnClose", "emitBlur"],
          },
          {
            guard: "canSelectDropdownItem",
            actions: ["selectItem"],
          },
        ],
        "PICKER.CHANGE": {
          guard: "isInteractive",
          actions: ["updatePickerIndices"],
        },
        "PICKER.CONFIRM": {
          guard: "canConfirmPicker",
          target: "closing",
          actions: ["confirmPicker", "invokeOnClose", "emitBlur"],
        },
        "PICKER.CANCEL": {
          target: "closing",
          actions: ["emitPickerCancelAction", "invokeOnClose", "emitBlur"],
        },
      },
    },

    closing: {
      tags: ["closing"],
      effects: ["waitForCloseAnimation"],
      on: {
        ANIMATION_END: {
          target: "closed",
        },
        ...closedTransitions,
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
      closeOnBackdropClick: ({ prop }) => prop("closeOnBackdropClick"),
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
      canConfirmPicker: ({ computed }) => computed("isInteractive"),
    },

    actions: {
      setupFormField: ({ context, prop, refs, scope, computed, action }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            getHost: () => prop("formContext"),
            id: scope.id ?? "select",
            getFormId: () => prop("form") || "",
            getName: () => prop("name") || "",
            getValue: () => context.get("value"),
            setValue: (rawVal: unknown) => {
              const nextVal = normalizeSelectValue(
                rawVal as SelectValue,
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

      emitFocus: ({ context, refs }) => {
        refs.get("formField")?.emitFocus(context.get("value"));
      },

      emitBlur: ({ context, refs }) => {
        refs.get("formField")?.emitBlur(context.get("value"));
      },

      emitPickerCancelBackdrop: ({ prop }) => {
        if (prop("mode") === "picker") {
          prop("onCancel")?.({ trigger: "backdrop" });
        }
      },

      emitPickerCancelAction: ({ prop, event }) => {
        if (event.type === "PICKER.CANCEL") {
          prop("onCancel")?.({ trigger: event.trigger ?? "cancel" });
        }
      },

      syncPickerDraft: ({ context, computed, prop }) => {
        if (prop("mode") !== "picker") return;
        const columns = computed("pickerColumns");
        const nextIndices = resolvePickerIndicesFromValue(
          columns,
          context.get("value"),
        );
        context.set("pendingIndices", nextIndices);
      },

      selectItem: ({ context, computed, prop, event }) => {
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

      setValue: ({ context, prop, event }) => {
        if (event.type !== "SET_VALUE") return;
        context.set(
          "value",
          normalizeSelectValue(event.value, Boolean(prop("multiple"))),
        );
      },

      clearValue: ({ context, prop }) => {
        context.set("value", prop("multiple") ? [] : null);
        context.set("pendingIndices", []);
        prop("onClear")?.({});
      },

      resetValue: ({ context, prop, refs }) => {
        const initial =
          refs.get("initialValue") ??
          normalizeSelectValue(prop("defaultValue"), Boolean(prop("multiple")));
        context.set("value", initial);
        context.set("invalid", false);
        context.set("pendingIndices", []);
      },

      updatePickerIndices: ({ context, computed, prop, event }) => {
        if (event.type !== "PICKER.CHANGE") return;
        const columns = computed("pickerColumns");
        const prevIndices = context.get("pendingIndices");
        const resolvedIndices = clampAndSnapPickerIndices(
          columns,
          event.indices,
          prevIndices,
        );
        context.set("pendingIndices", resolvedIndices);

        let changedCol = resolvedIndices.findIndex(
          (idx, colIdx) => idx !== (prevIndices[colIdx] ?? 0),
        );
        if (changedCol < 0) changedCol = 0;

        const selectedItems: SelectPickerColumnItem[] = [];
        const selectedValues: SelectScalarValue[] = [];
        for (let c = 0; c < columns.length; c++) {
          const col = columns[c] ?? [];
          const item = col[resolvedIndices[c] ?? 0];
          if (item) {
            selectedItems.push(item);
            selectedValues.push(item.value);
          }
        }

        const changedItem = selectedItems[changedCol];
        if (changedItem) {
          prop("onColumnChange")?.({
            column: changedCol,
            index: resolvedIndices[changedCol] ?? 0,
            value: changedItem.value,
            label: changedItem.label,
            item: changedItem,
            values: selectedValues,
            items: selectedItems,
          });
        }
      },

      confirmPicker: ({ context, computed, prop }) => {
        const columns = computed("pickerColumns");
        if (columns.length === 0) return;

        const indices = clampAndSnapPickerIndices(
          columns,
          context.get("pendingIndices"),
          context.get("pendingIndices"),
        );

        const pickedItems: SelectPickerColumnItem[] = [];
        for (let c = 0; c < columns.length; c++) {
          const col = columns[c] ?? [];
          const item = col[indices[c] ?? 0];
          if (item && !item.disabled) {
            pickedItems.push(item);
          }
        }

        if (pickedItems.length === 0) return;

        const singleColumn = columns.length === 1 && !prop("multiple");
        const committedValue: SelectValue = singleColumn
          ? (pickedItems[0]?.value ?? null)
          : pickedItems.map((it) => it.value);
        const committedLabel: string | string[] = singleColumn
          ? (pickedItems[0]?.label ?? "")
          : pickedItems.map((it) => it.label);

        prop("onConfirm")?.({
          value: committedValue,
          label: committedLabel,
          index: indices,
          items: pickedItems,
        });
        context.set("value", committedValue);
      },
    },

    effects: {
      waitForCloseAnimation: ({ send, prop }) => {
        let cancelled = false;
        const explicitDuration = prop("duration");
        const delay =
          typeof explicitDuration === "number" && explicitDuration >= 0
            ? explicitDuration
            : DEFAULT_CLOSE_DURATION;

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
