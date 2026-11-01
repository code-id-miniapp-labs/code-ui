import { createMachine } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
import { createEventBus, isEqual, isNotEmpty } from "@code-ui/utils";
import type {
  CheckboxGroupBusEvents,
  CheckboxGroupContext,
  CheckboxGroupMachine,
  CheckboxGroupParams,
  CheckboxGroupProps,
  CheckboxGroupSchema,
} from "./checkbox-group.types";
import { defaultCheckboxGroupProps } from "./checkbox-group.props";

function emitGroupChange(
  {
    refs,
    context,
    computed,
  }: Pick<CheckboxGroupParams, "refs" | "context" | "computed">,
  overrides?: Partial<CheckboxGroupBusEvents["group:change"]>,
): void {
  const bus = refs.get("bus");
  if (!bus) return;
  bus.emit("group:change", {
    value: context.get("value") ?? [],
    disabled: computed("isDisabled"),
    invalid: Boolean(context.get("invalid")),
    size: context.get("size") || "md",
    color: context.get("color") || "primary",
    variant: context.get("variant") || "outline",
    ...overrides,
  });
}

export const checkboxGroupMachine: CheckboxGroupMachine =
  createMachine<CheckboxGroupSchema>({
    props: ({ props }) => ({
      ...defaultCheckboxGroupProps,
      ...props,
    }),

    initialState: () => "idle",

    refs: ({ prop }) => {
      const rawVal = prop("value");
      const rawDefault = prop("defaultValue");
      const initial: string[] = Array.isArray(rawVal)
        ? rawVal
        : Array.isArray(rawDefault)
          ? rawDefault
          : [];
      return {
        initialValue: initial,
        bus: createEventBus<CheckboxGroupBusEvents>(),
        currentFormBus: prop("formBus"),
        formField: undefined,
        busDisposers: [],
      };
    },

    context: ({ prop, bindable, getRefs, getContext, getComputed }) => {
      const propBindable = <
        K extends keyof CheckboxGroupContext & keyof CheckboxGroupProps,
      >(
        key: K,
        defaultValue: CheckboxGroupContext[K],
      ) =>
        bindable<CheckboxGroupContext[K]>(() => ({
          value: prop(key) as CheckboxGroupContext[K] | undefined,
          defaultValue,
        }));

      const stateBindable = <K extends keyof CheckboxGroupContext>(
        _key: K,
        defaultValue: CheckboxGroupContext[K],
      ) =>
        bindable<CheckboxGroupContext[K]>(() => ({
          defaultValue,
        }));

      return {
        value: bindable<string[]>(() => {
          const rawVal = prop("value");
          const controlledVal = Array.isArray(rawVal) ? rawVal : undefined;
          const rawDefault = prop("defaultValue");
          const initial: string[] =
            controlledVal ?? (Array.isArray(rawDefault) ? rawDefault : []);

          return {
            value: controlledVal,
            defaultValue: initial,
            isEqual,
            onChange: (nextVal) => {
              prop("onChange")?.({ value: nextVal });

              emitGroupChange(
                {
                  refs: getRefs(),
                  context: getContext(),
                  computed: getComputed(),
                },
                { value: nextVal },
              );

              const formField = getRefs().get("formField");
              if (formField) {
                formField.emitInput(nextVal);
                formField.emitChange(nextVal);
              }
            },
          };
        }),

        name: propBindable("name", ""),
        form: propBindable("form", ""),
        disabled: propBindable("disabled", false),
        readOnly: propBindable("readOnly", false),
        formDisabled: stateBindable("formDisabled", false),
        formReadOnly: stateBindable("formReadOnly", false),
        fieldDisabled: propBindable("fieldDisabled", false),
        fieldSize: propBindable("fieldSize", ""),

        invalid: bindable<boolean>(() => {
          const rawInvalid = prop("invalid");
          return {
            value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
            defaultValue: false,
          };
        }),

        required: propBindable("required", false),
        color: propBindable("color", "primary"),
        size: propBindable("size", "md"),
        orientation: propBindable("orientation", "vertical"),
        variant: propBindable("variant", "outline"),
        legend: propBindable("legend", ""),
        min: propBindable("min", null),
        max: propBindable("max", null),
        items: propBindable("items", []),
        ui: propBindable("ui", {}),
      };
    },

    computed: {
      isDisabled: ({ context }) =>
        Boolean(
          context.get("disabled") ||
          context.get("formDisabled") ||
          context.get("fieldDisabled"),
        ),
      isReadOnly: ({ context }) =>
        Boolean(context.get("readOnly") || context.get("formReadOnly")),
      isInteractive: ({ computed }) =>
        !computed("isDisabled") && !computed("isReadOnly"),
    },

    watch: ({ prop, refs }) => {
      const nextFormBus = prop("formBus");
      if (nextFormBus !== refs.get("currentFormBus")) {
        refs.set("currentFormBus", nextFormBus);
        refs.get("formField")?.rebind(nextFormBus ?? null);
      }
    },

    effects: ["trackGroupProps"],
    entry: ["setupFormField", "setupGroupBus"],
    exit: ["cleanupFormField", "cleanupGroupBus"],

    on: {
      SET_VALUE: {
        guard: "isInteractive",
        actions: ["setValue"],
      },
      TOGGLE_VALUE: {
        guard: "isInteractive",
        actions: ["toggleValue"],
      },
      SELECT_ALL: {
        guard: "isInteractive",
        actions: ["selectAll"],
      },
      CLEAR: {
        guard: "isInteractive",
        actions: ["clearValue"],
      },
      SET_INVALID: {
        actions: ["setInvalid"],
      },
      RESET_VALUE: {
        target: "idle",
        actions: ["resetValue"],
      },
    },

    states: {
      idle: {
        tags: ["idle"],
      },
    },

    implementations: {
      guards: {
        isInteractive: ({ computed }) => computed("isInteractive"),
      },

      actions: {
        setValue: ({ context, event }) => {
          if ("value" in event && Array.isArray(event.value)) {
            context.set("value", event.value);
          }
        },
        toggleValue: ({ context, event }) => {
          if (!("value" in event)) return;
          const current = context.get("value") ?? [];
          const target = String(event.value);
          const isSelected = current.includes(target);
          const rawMin = context.get("min");
          const min =
            rawMin !== null &&
            rawMin !== undefined &&
            !Number.isNaN(Number(rawMin))
              ? Number(rawMin)
              : null;
          const rawMax = context.get("max");
          const max =
            rawMax !== null &&
            rawMax !== undefined &&
            !Number.isNaN(Number(rawMax))
              ? Number(rawMax)
              : null;

          const targetChecked =
            "checked" in event && typeof event.checked === "boolean"
              ? event.checked
              : !isSelected;

          if (targetChecked === isSelected) {
            return;
          }

          if (isSelected) {
            if (min !== null && current.length <= min) return;
            context.set(
              "value",
              current.filter((v: string) => v !== target),
            );
          } else {
            if (max !== null && current.length >= max) return;
            context.set("value", [...current, target]);
          }
        },
        selectAll: ({ context }) => {
          const rawItems = context.get("items") ?? [];
          const allValues = rawItems.map((raw) => {
            if (typeof raw === "string") return raw;
            return String(raw.value ?? "");
          });
          const rawMax = context.get("max");
          const max =
            rawMax !== null &&
            rawMax !== undefined &&
            !Number.isNaN(Number(rawMax))
              ? Number(rawMax)
              : null;
          const nextValues = max !== null ? allValues.slice(0, max) : allValues;
          context.set("value", nextValues);
        },
        clearValue: ({ context }) => {
          const rawMin = context.get("min");
          const min =
            rawMin !== null &&
            rawMin !== undefined &&
            !Number.isNaN(Number(rawMin))
              ? Number(rawMin)
              : null;
          if (min !== null && min > 0) return;
          context.set("value", []);
        },
        resetValue: ({ context, refs, prop, computed }) => {
          const rawDefault = prop("defaultValue");
          const fallback = Array.isArray(rawDefault) ? rawDefault : [];
          const initial: string[] = refs.get("initialValue") ?? fallback;
          context.set("value", initial);
          context.set("invalid", false);
          emitGroupChange(
            { refs, context, computed },
            { value: initial, invalid: false },
          );
        },
        setInvalid: ({ context, refs, computed, event }) => {
          if ("invalid" in event) {
            const nextInvalid = Boolean(event.invalid);
            context.set("invalid", nextInvalid);
            emitGroupChange(
              { refs, context, computed },
              { invalid: nextInvalid },
            );
          }
        },
        setupGroupBus: ({ refs, context, computed, send }) => {
          const bus = refs.get("bus");
          if (bus) {
            const unsub = bus.on("checkbox:toggle", ({ value }) => {
              send({ type: "TOGGLE_VALUE", value });
            });
            const disposers = refs.get("busDisposers") || [];
            disposers.push(unsub);
            refs.set("busDisposers", disposers);
            emitGroupChange({ refs, context, computed });
          }
        },
        cleanupGroupBus: ({ refs }) => {
          const disposers = refs.get("busDisposers") || [];
          for (const unsub of disposers) unsub?.();
          refs.set("busDisposers", []);
        },
        setupFormField: ({ context, prop, refs, scope, computed }) => {
          setupFormFieldSync(
            {
              component: prop("component"),
              bus: prop("formBus"),
              id: scope.id ?? "checkbox-group",
              getFormId: () => context.get("form") || prop("form") || "",
              getName: () => context.get("name") || prop("name") || "",
              getValue: () => context.get("value"),
              setValue: (rawVal: unknown) => {
                context.set("value", Array.isArray(rawVal) ? rawVal : []);
              },
              resetValue: () => {
                const rawDefault = prop("defaultValue");
                const fallback = Array.isArray(rawDefault) ? rawDefault : [];
                const initial: string[] = refs.get("initialValue") ?? fallback;
                context.set("value", initial);
                context.set("invalid", false);
                emitGroupChange(
                  { refs, context, computed },
                  { value: initial, invalid: false },
                );
              },
              focus: () => {},
              getValidateOn: () => prop("validateOn"),
              isDisabled: () => computed("isDisabled"),
              onValidationChange: (isValid) => {
                context.set("invalid", !isValid);
                emitGroupChange(
                  { refs, context, computed },
                  { invalid: !isValid },
                );
              },
              onStateChange: (s) => {
                if (s.fieldDisabled !== undefined) {
                  context.set("fieldDisabled", Boolean(s.fieldDisabled));
                }
                if (s.fieldSize !== undefined) {
                  context.set("fieldSize", s.fieldSize);
                }
                if (s.formDisabled !== undefined) {
                  context.set("formDisabled", Boolean(s.formDisabled));
                }
                if (s.formReadOnly !== undefined) {
                  context.set("formReadOnly", Boolean(s.formReadOnly));
                }
                emitGroupChange({ refs, context, computed });
              },
            },
            refs,
          );
        },
        cleanupFormField: ({ refs }) => {
          cleanupFormFieldSync(refs);
        },
      },

      effects: {
        trackGroupProps: ({ refs, context, computed, track }) => {
          let initial = true;
          track(
            [
              () => (context.get("value") ?? []).join(","),
              () => computed("isDisabled"),
              () => context.get("invalid"),
              () => context.get("size"),
              () => context.get("color"),
              () => context.get("variant"),
            ],
            () => {
              if (initial) {
                initial = false;
                return;
              }
              emitGroupChange({ refs, context, computed });
            },
          );
        },
      },
    },
  });
