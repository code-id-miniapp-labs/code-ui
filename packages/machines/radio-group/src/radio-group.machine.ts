import { createMachine } from "@code-ui/core";
import { setupFormFieldSync, cleanupFormFieldSync } from "@code-ui/form/context";
import { createEventBus, isNotEmpty } from "@code-ui/utils";
import type {
  RadioGroupBusEvents,
  RadioGroupColor,
  RadioGroupMachine,
  RadioGroupOrientation,
  RadioGroupSchema,
  RadioGroupSize,
  RadioGroupVariant,
} from "./radio-group.types";
import { defaultRadioGroupProps } from "./radio-group.props";

export const radioGroupMachine: RadioGroupMachine = createMachine<RadioGroupSchema>({
  props: ({ props }) => ({
    ...defaultRadioGroupProps,
    ...props,
  }),

  initialState: () => "idle",

  refs: ({ prop }) => {
    const rawVal = prop("value");
    const initial =
      rawVal !== undefined && rawVal !== null
        ? String(rawVal)
        : (prop("defaultValue") ?? null);
    return {
      initialValue: initial,
      bus: createEventBus<RadioGroupBusEvents>(),
      currentFormBus: prop("formBus"),
      formField: undefined,
      busDisposers: [],
    };
  },

  context: ({ prop, bindable, getRefs }) => {
    const b = <T>(key: any, defaultValue: T) =>
      bindable<T>(() => ({ value: prop(key), defaultValue }));

    return {
      value: bindable<string | null>(() => {
        const rawVal = prop("value");
        const controlledVal =
          rawVal !== undefined && rawVal !== null ? String(rawVal) : undefined;
        const initial = controlledVal ?? prop("defaultValue") ?? null;

        return {
          value: controlledVal,
          defaultValue: initial,
          onChange: (nextVal) => {
            const valStr = nextVal ?? "";
            prop("onValueChange")?.({ value: valStr });
            prop("onChange")?.({ value: valStr });
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
      fieldSize: b<RadioGroupSize | "">("fieldSize", ""),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      required: b("required", false),
      color: b<RadioGroupColor>("color", "primary"),
      size: b<RadioGroupSize>("size", "md"),
      orientation: b<RadioGroupOrientation>("orientation", "vertical"),
      variant: b<RadioGroupVariant>("variant", "outline"),
      legend: b("legend", ""),
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
      controlledVal !== undefined &&
      controlledVal !== null &&
      controlledVal !== context.get("value")
    ) {
      context.set("value", String(controlledVal));
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
    if (controlledItems !== undefined) {
      context.set("items", controlledItems);
    }

    const bus = refs.get("bus");
    if (bus) {
      bus.emit("group:change", {
        value: context.get("value"),
        disabled: Boolean(context.get("disabled") || context.get("formDisabled") || context.get("fieldDisabled")),
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
        if ("value" in event) {
          context.set("value", event.value);
        }
      },
      clearValue: ({ context }) => {
        context.set("value", null);
      },
      resetValue: ({ context, refs, prop }) => {
        const initial =
          refs.get("initialValue") ??
          (prop("defaultValue") !== undefined ? prop("defaultValue") : null);
        context.set("value", initial ?? null);
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
          const unsub = bus.on("radio:select", ({ value }) => {
            send({ type: "SET_VALUE", value });
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
            id: scope.id ?? "radio-group",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () => context.get("name") || prop("name") || "",
            getValue: () => context.get("value"),
            setValue: (rawVal: any) => {
              context.set("value", rawVal ?? null);
            },
            resetValue: () => {
              const initial =
                refs.get("initialValue") ??
                (prop("defaultValue") !== undefined ? prop("defaultValue") : null);
              context.set("value", initial ?? null);
              context.set("invalid", false);
              const bus = refs.get("bus");
              if (bus) {
                bus.emit("group:change", {
                  value: initial ?? null,
                  disabled: Boolean(context.get("disabled") || context.get("formDisabled") || context.get("fieldDisabled")),
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
                  value: context.get("value"),
                  disabled: Boolean(context.get("disabled") || context.get("formDisabled") || context.get("fieldDisabled")),
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
