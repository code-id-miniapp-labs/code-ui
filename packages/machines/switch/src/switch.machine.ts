import { createMachine } from "@code-ui/core";
import { setupFormFieldSync, cleanupFormFieldSync } from "@code-ui/form/context";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  SwitchColor,
  SwitchMachine,
  SwitchSchema,
  SwitchSize,
} from "./switch.types";
import { defaultSwitchProps } from "./switch.props";

export const switchMachine: SwitchMachine = createMachine<SwitchSchema>({
  props: ({ props }) => ({
    ...defaultSwitchProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const rawChecked = prop("checked");
    const initial = isNotNull(rawChecked)
      ? Boolean(rawChecked)
      : Boolean(prop("defaultChecked"));
    return initial ? "checked" : "unchecked";
  },

  refs: ({ prop }) => {
    const rawChecked = prop("checked");
    const initial = isNotNull(rawChecked)
      ? Boolean(rawChecked)
      : Boolean(prop("defaultChecked"));
    return {
      initialChecked: initial,
      formField: undefined,
      busDisposers: [],
    };
  },

  context: ({ prop, bindable, getRefs }) => {
    const b = <T>(key: any, defaultValue: T) =>
      bindable<T>(() => ({ value: prop(key), defaultValue }));

    return {
      checked: bindable<boolean>(() => {
        const rawChecked = prop("checked");
        const controlledVal = isNotNull(rawChecked)
          ? Boolean(rawChecked)
          : undefined;
        const initial = controlledVal ?? Boolean(prop("defaultChecked"));

        return {
          value: controlledVal,
          defaultValue: initial,
          onChange: (nextVal) => {
            prop("onCheckedChange")?.({ checked: nextVal });
            prop("onChange")?.({ checked: nextVal });
            prop("component")?.triggerEvent?.("change", {
              value: nextVal,
              checked: nextVal,
            });
            prop("component")?.setData?.({ checked: nextVal });

            const formField = getRefs().get("formField");
            if (formField) {
              formField.emitInput(nextVal);
              formField.emitChange(nextVal);
            }
          },
        };
      }),

      disabled: b("disabled", false),
      readOnly: b("readOnly", false),
      formDisabled: b("formDisabled", false),
      formReadOnly: b("formReadOnly", false),
      fieldDisabled: b("fieldDisabled", false),
      fieldSize: b<SwitchSize | "">("fieldSize", ""),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      required: b("required", false),
      loading: b("loading", false),
      color: b<SwitchColor>("color", "primary"),
      size: b<SwitchSize>("size", "md"),
      value: b("value", "on"),
      name: b("name", ""),
      form: b("form", ""),
      label: b("label", ""),
      description: b("description", ""),
      checkedIcon: b("checkedIcon", ""),
      uncheckedIcon: b("uncheckedIcon", ""),
      loadingIcon: b("loadingIcon", ""),
      ui: b("ui", {}),
    };
  },

  computed: {
    isChecked: ({ context }) => Boolean(context.get("checked")),
    isInteractive: ({ context }) => {
      if (context.get("loading")) return false;
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

  watch: ({ prop, context, refs, send, state }) => {
    const controlledChecked = prop("checked");
    if (isNotNull(controlledChecked)) {
      const boolVal = Boolean(controlledChecked);
      if (boolVal && !state.matches("checked")) {
        send({ type: "SET_CHECKED", checked: true });
      } else if (!boolVal && state.matches("checked")) {
        send({ type: "SET_CHECKED", checked: false });
      }
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

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  on: {
    RESET_VALUE: [
      {
        guard: "isInitialChecked",
        target: "checked",
        actions: ["resetChecked"],
      },
      {
        target: "unchecked",
        actions: ["resetChecked"],
      },
    ],
    SET_CHECKED: [
      {
        guard: "isEventChecked",
        target: "checked",
        actions: ["setCheckedTrue"],
      },
      {
        target: "unchecked",
        actions: ["setCheckedFalse"],
      },
    ],
  },

  states: {
    unchecked: {
      tags: ["unchecked"],
      on: {
        TOGGLE: {
          guard: "isInteractive",
          target: "checked",
          actions: ["setCheckedTrue"],
        },
        CHECK: {
          guard: "isInteractive",
          target: "checked",
          actions: ["setCheckedTrue"],
        },
      },
    },

    checked: {
      tags: ["checked"],
      on: {
        TOGGLE: {
          guard: "isInteractive",
          target: "unchecked",
          actions: ["setCheckedFalse"],
        },
        UNCHECK: {
          guard: "isInteractive",
          target: "unchecked",
          actions: ["setCheckedFalse"],
        },
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
      isEventChecked: ({ event }) =>
        "checked" in event && Boolean(event.checked),
      isInitialChecked: ({ refs }) => Boolean(refs.get("initialChecked")),
    },

    actions: {
      setCheckedTrue: ({ context }) => {
        context.set("checked", true);
      },
      setCheckedFalse: ({ context }) => {
        context.set("checked", false);
      },
      resetChecked: ({ context, refs }) => {
        const initial = Boolean(refs.get("initialChecked"));
        context.set("checked", initial);
      },
      setupFormField: ({ context, prop, refs, scope, state }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            bus: prop("formBus"),
            id: scope.id ?? "switch",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () => context.get("name") || prop("name") || "",
            getValue: () => context.get("checked"),
            setValue: (rawVal: any) => {
              const nextChecked = Boolean(rawVal);
              context.set("checked", nextChecked);
              state.set(nextChecked ? "checked" : "unchecked");
            },
            resetValue: () => {
              const initial =
                refs.get("initialChecked") ??
                (prop("defaultChecked") !== undefined
                  ? Boolean(prop("defaultChecked"))
                  : false);
              context.set("checked", initial);
              context.set("invalid", false);
              state.set(initial ? "checked" : "unchecked");
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
