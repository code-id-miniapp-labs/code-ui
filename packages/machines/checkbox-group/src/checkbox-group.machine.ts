import { createMachine } from "@code-ui/core";
import { setupFormFieldSync, cleanupFormFieldSync } from "@code-ui/form/context";
import { createEventBus, isEqual, isNotEmpty } from "@code-ui/utils";
import type {
  CheckboxGroupBusEvents,
  CheckboxGroupColor,
  CheckboxGroupMachine,
  CheckboxGroupOrientation,
  CheckboxGroupSchema,
  CheckboxGroupSize,
  CheckboxGroupVariant,
} from "./checkbox-group.types";
import { defaultCheckboxGroupProps } from "./checkbox-group.props";

export const checkboxGroupMachine: CheckboxGroupMachine = createMachine<CheckboxGroupSchema>({
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

  context: ({ prop, bindable, getRefs }) => {
    const b = <T>(key: any, defaultValue: T) =>
      bindable<T>(() => ({ value: prop(key), defaultValue }));

    return {
      value: bindable<string[]>(() => {
        const rawVal = prop("value");
        const controlledVal = Array.isArray(rawVal) ? rawVal : undefined;
        const rawDefault = prop("defaultValue");
        const initial: string[] =
          controlledVal ??
          (Array.isArray(rawDefault) ? rawDefault : []);

        return {
          value: controlledVal,
          defaultValue: initial,
          onChange: (nextVal) => {
            prop("onValueChange")?.({ value: nextVal });
            prop("onChange")?.({ value: nextVal });
            prop("component")?.triggerEvent?.("change", {
              value: nextVal,
            });
            prop("component")?.setData?.({ value: nextVal });

            const bus = getRefs().get("bus");
            if (bus) {
              bus.emit("group:change", {
                value: nextVal,
                disabled: Boolean(prop("disabled")),
                invalid: Boolean(prop("invalid")),
                size: prop("size") ?? "md",
                color: prop("color") ?? "primary",
                variant: prop("variant") ?? "outline",
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

      name: b("name", ""),
      form: b("form", ""),
      disabled: b("disabled", false),
      readOnly: b("readOnly", false),
      formDisabled: b("formDisabled", false),
      formReadOnly: b("formReadOnly", false),
      fieldDisabled: b("fieldDisabled", false),
      fieldSize: b<CheckboxGroupSize | "">("fieldSize", ""),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      required: b("required", false),
      color: b<CheckboxGroupColor>("color", "primary"),
      size: b<CheckboxGroupSize>("size", "md"),
      orientation: b<CheckboxGroupOrientation>("orientation", "vertical"),
      variant: b<CheckboxGroupVariant>("variant", "outline"),
      legend: b("legend", ""),
      min: b<number | null>("min", null),
      max: b<number | null>("max", null),
      items: b<any[]>("items", []),
      ui: b("ui", {}),
    };
  },

  computed: {
    isInteractive: ({ context }) => {
      if (
        context.get("disabled") ||
        context.get("formDisabled") ||
        context.get("fieldDisabled")
      ) {
        return false;
      }
      if (context.get("readOnly") || context.get("formReadOnly")) {
        return false;
      }
      return true;
    },
  },

  watch: ({ prop, context, refs }) => {
    const controlledVal = prop("value");
    if (
      Array.isArray(controlledVal) &&
      !isEqual(controlledVal, context.get("value"))
    ) {
      context.set("value", controlledVal);
    }
    const controlledInvalid = prop("invalid");
    if (controlledInvalid !== undefined && controlledInvalid !== null) {
      context.set("invalid", Boolean(controlledInvalid));
    }
    const controlledFieldDisabled = prop("fieldDisabled");
    if (controlledFieldDisabled !== undefined) {
      context.set("fieldDisabled", controlledFieldDisabled);
    }
    const controlledFieldSize = prop("fieldSize");
    if (controlledFieldSize !== undefined) {
      context.set("fieldSize", controlledFieldSize);
    }
    const controlledDisabled = prop("disabled");
    if (controlledDisabled !== undefined) {
      context.set("disabled", Boolean(controlledDisabled));
    }
    const controlledItems = prop("items");
    if (
      controlledItems !== undefined &&
      !isEqual(controlledItems, context.get("items"))
    ) {
      context.set("items", controlledItems);
    }
    const controlledMin = prop("min");
    if (controlledMin !== undefined) {
      context.set("min", controlledMin);
    }
    const controlledMax = prop("max");
    if (controlledMax !== undefined) {
      context.set("max", controlledMax);
    }

    const bus = refs.get("bus");
    if (bus) {
      bus.emit("group:change", {
        value: context.get("value") ?? [],
        disabled: Boolean(
          context.get("disabled") ||
            context.get("formDisabled") ||
            context.get("fieldDisabled"),
        ),
        invalid: Boolean(context.get("invalid")),
        size: context.get("size") || "md",
        color: context.get("color") || "primary",
        variant: context.get("variant") || "outline",
      });
    }

    const nextForm = prop("form") ?? "";
    const nextName = prop("name") ?? "";
    if (nextForm !== context.get("form") || nextName !== context.get("name")) {
      context.set("form", nextForm);
      context.set("name", nextName);
      refs.get("formField")?.rebind();
    }
    const nextFormBus = prop("formBus");
    const prevFormBus = refs.get("currentFormBus");
    if (nextFormBus !== prevFormBus) {
      refs.set("currentFormBus", nextFormBus);
      refs.get("formField")?.rebind(nextFormBus ?? null);
    }
  },

  entry: ["setupFormField", "setupGroupBus"],
  exit: ["cleanupFormField", "cleanupGroupBus"],

  on: {
    RESET_VALUE: {
      target: "idle",
      actions: ["resetValue"],
    },
  },

  states: {
    idle: {
      tags: ["idle"],
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
      },
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
          rawMin !== null && rawMin !== undefined && !Number.isNaN(Number(rawMin))
            ? Number(rawMin)
            : null;
        const rawMax = context.get("max");
        const max =
          rawMax !== null && rawMax !== undefined && !Number.isNaN(Number(rawMax))
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
          context.set("value", current.filter((v: string) => v !== target));
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
          rawMax !== null && rawMax !== undefined && !Number.isNaN(Number(rawMax))
            ? Number(rawMax)
            : null;
        const nextValues = max !== null ? allValues.slice(0, max) : allValues;
        context.set("value", nextValues);
      },
      clearValue: ({ context }) => {
        const rawMin = context.get("min");
        const min =
          rawMin !== null && rawMin !== undefined && !Number.isNaN(Number(rawMin))
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
      setupGroupBus: ({ refs, send }) => {
        const bus = refs.get("bus");
        if (bus) {
          const unsub = bus.on("checkbox:toggle", ({ value }) => {
            send({ type: "TOGGLE_VALUE", value });
          });
          const disposers = refs.get("busDisposers") || [];
          disposers.push(unsub);
          refs.set("busDisposers", disposers);
        }
      },
      cleanupGroupBus: ({ refs }) => {
        const disposers = refs.get("busDisposers") || [];
        for (const unsub of disposers) unsub?.();
        refs.set("busDisposers", []);
      },
      setupFormField: ({ context, prop, refs, scope }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            bus: prop("formBus"),
            id: scope.id ?? "checkbox-group",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () => context.get("name") || prop("name") || "",
            getValue: () => context.get("value"),
            setValue: (rawVal: any) => {
              context.set("value", Array.isArray(rawVal) ? rawVal : []);
            },
            resetValue: () => {
              const rawDefault = prop("defaultValue");
              const fallback = Array.isArray(rawDefault) ? rawDefault : [];
              const initial: string[] = refs.get("initialValue") ?? fallback;
              context.set("value", initial);
              context.set("invalid", false);
              const bus = refs.get("bus");
              if (bus) {
                bus.emit("group:change", {
                  value: initial,
                  disabled: Boolean(
                    context.get("disabled") ||
                      context.get("formDisabled") ||
                      context.get("fieldDisabled"),
                  ),
                  invalid: false,
                  size: context.get("size") || "md",
                  color: context.get("color") || "primary",
                  variant: context.get("variant") || "outline",
                });
              }
            },
            focus: () => {},
            getValidateOn: () => prop("validateOn"),
            isDisabled: () =>
              Boolean(
                context.get("disabled") ||
                  context.get("formDisabled") ||
                  context.get("fieldDisabled"),
              ),
            onValidationChange: (isValid) => {
              context.set("invalid", !isValid);
              const bus = refs.get("bus");
              if (bus) {
                bus.emit("group:change", {
                  value: context.get("value") ?? [],
                  disabled: Boolean(
                    context.get("disabled") ||
                      context.get("formDisabled") ||
                      context.get("fieldDisabled"),
                  ),
                  invalid: !isValid,
                  size: context.get("size") || "md",
                  color: context.get("color") || "primary",
                  variant: context.get("variant") || "outline",
                });
              }
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
