import { createMachine } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
import { isEqual, isNotEmpty } from "@code-ui/utils";
import type {
  CheckboxGroupContext,
  CheckboxGroupMachine,
  CheckboxGroupMachineContext,
  CheckboxGroupProps,
  CheckboxGroupSchema,
} from "./checkbox-group.types";
import { defaultCheckboxGroupProps } from "./checkbox-group.props";

export const checkboxGroupMachine: CheckboxGroupMachine =
  createMachine<CheckboxGroupSchema>({
    props: ({ props }) => ({
      ...defaultCheckboxGroupProps,
      ...props,
    }),

    initialState: () => "idle",

    refs: ({ prop, context, computed, send }) => {
      const rawVal = prop("value");
      const rawDefault = prop("defaultValue");
      const initial: string[] = Array.isArray(rawVal)
        ? rawVal
        : Array.isArray(rawDefault)
          ? rawDefault
          : [];
      return {
        initialValue: initial,
        currentFormBus: prop("formBus"),
        formField: undefined,
        groupContext: {
          value: () => context.get("value") ?? [],
          disabled: () => computed("isDisabled"),
          readOnly: () => computed("isReadOnly"),
          invalid: () => Boolean(context.get("invalid")),
          color: () => context.get("color") || "primary",
          size: () => context.get("size") || "md",
          variant: () => context.get("variant") || "outline",
          setValue: (value) => send({ type: "SET_VALUE", value }),
          toggleValue: (value, checked) =>
            send({ type: "TOGGLE_VALUE", value, checked }),
        } satisfies CheckboxGroupContext,
      };
    },

    context: ({ prop, bindable, getRefs }) => {
      const propBindable = <
        K extends keyof CheckboxGroupMachineContext & keyof CheckboxGroupProps,
      >(
        key: K,
        defaultValue: CheckboxGroupMachineContext[K],
      ) =>
        bindable<CheckboxGroupMachineContext[K]>(() => ({
          value: prop(key) as CheckboxGroupMachineContext[K] | undefined,
          defaultValue,
        }));

      const stateBindable = <K extends keyof CheckboxGroupMachineContext>(
        _key: K,
        defaultValue: CheckboxGroupMachineContext[K],
      ) =>
        bindable<CheckboxGroupMachineContext[K]>(() => ({
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

    entry: ["setupFormField"],
    exit: ["cleanupFormField"],

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
        resetValue: ({ context, refs, prop }) => {
          const rawDefault = prop("defaultValue");
          const fallback = Array.isArray(rawDefault) ? rawDefault : [];
          const initial: string[] = refs.get("initialValue") ?? fallback;
          context.set("value", initial);
          context.set("invalid", false);
        },
        setInvalid: ({ context, event }) => {
          if ("invalid" in event) {
            context.set("invalid", Boolean(event.invalid));
          }
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
              },
              focus: () => {},
              getValidateOn: () => prop("validateOn"),
              isDisabled: () => computed("isDisabled"),
              onValidationChange: (isValid) => {
                context.set("invalid", !isValid);
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
              },
            },
            refs,
          );
        },
        cleanupFormField: ({ refs }) => {
          cleanupFormFieldSync(refs);
        },
      },

    },
  });
