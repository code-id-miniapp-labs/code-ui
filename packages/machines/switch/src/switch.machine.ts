import { createMachine } from "@code-ui/core";
import { bindFormField } from "@code-ui/form/context";
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

  context: ({ prop, bindable, getRefs }) => ({
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

    disabled: bindable<boolean>(() => ({
      value: prop("disabled"),
      defaultValue: false,
    })),

    readOnly: bindable<boolean>(() => ({
      value: prop("readOnly"),
      defaultValue: false,
    })),

    formDisabled: bindable<boolean>(() => ({
      defaultValue: false,
    })),

    formReadOnly: bindable<boolean>(() => ({
      defaultValue: false,
    })),

    fieldDisabled: bindable<boolean>(() => ({
      value: prop("fieldDisabled"),
      defaultValue: false,
    })),

    fieldSize: bindable<any>(() => ({
      value: prop("fieldSize"),
      defaultValue: "",
    })),

    invalid: bindable<boolean>(() => {
      const rawInvalid = prop("invalid");
      return {
        value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
        defaultValue: false,
      };
    }),

    required: bindable<boolean>(() => ({
      value: prop("required"),
      defaultValue: false,
    })),

    loading: bindable<boolean>(() => ({
      value: prop("loading"),
      defaultValue: false,
    })),

    color: bindable<SwitchColor>(() => ({
      value: prop("color"),
      defaultValue: "primary",
    })),

    size: bindable<SwitchSize>(() => ({
      value: prop("size"),
      defaultValue: "md",
    })),

    value: bindable<string>(() => ({
      value: prop("value"),
      defaultValue: "on",
    })),

    name: bindable<string>(() => ({
      value: prop("name"),
      defaultValue: "",
    })),

    form: bindable<string>(() => ({
      value: prop("form"),
      defaultValue: "",
    })),

    label: bindable<string>(() => ({
      value: prop("label"),
      defaultValue: "",
    })),

    description: bindable<string>(() => ({
      value: prop("description"),
      defaultValue: "",
    })),

    checkedIcon: bindable<string>(() => ({
      value: prop("checkedIcon"),
      defaultValue: "",
    })),

    uncheckedIcon: bindable<string>(() => ({
      value: prop("uncheckedIcon"),
      defaultValue: "",
    })),

    loadingIcon: bindable<string>(() => ({
      value: prop("loadingIcon"),
      defaultValue: "",
    })),

    ui: bindable<any>(() => ({
      value: prop("ui") ?? {},
      defaultValue: {},
    })),
  }),

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
    const controlledInvalid = prop("invalid");
    if (isNotNull(controlledInvalid)) {
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
        refs.get("formField")?.dispose();
        refs.set("currentFormBus", prop("formBus"));

        let suppressEmit = false;

        const bound = bindFormField({
          component: prop("component"),
          bus: prop("formBus"),
          id: scope.id ?? "switch",
          getFormId: () => context.get("form") || prop("form") || "",
          getName: () => context.get("name") || prop("name") || "",
          getValue: () => context.get("checked"),
          setValue: (rawVal: any) => {
            suppressEmit = true;
            try {
              const nextChecked = Boolean(rawVal);
              context.set("checked", nextChecked);
              state.set(nextChecked ? "checked" : "unchecked");
            } finally {
              suppressEmit = false;
            }
          },
          resetValue: () => {
            suppressEmit = true;
            try {
              const initial =
                refs.get("initialChecked") ??
                (prop("defaultChecked") !== undefined
                  ? Boolean(prop("defaultChecked"))
                  : false);
              context.set("checked", initial);
              context.set("invalid", false);
              state.set(initial ? "checked" : "unchecked");
            } finally {
              suppressEmit = false;
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
          onValidationChange: (valState) => {
            context.set("invalid", !valState.isValid);
          },
          onFormStateChange: ({ disabled, readOnly }) => {
            context.set("formDisabled", disabled);
            context.set("formReadOnly", readOnly);
          },
        });

        const bus = bound.bus;
        const disposers: Array<() => void> = [];
        if (bus) {
          disposers.push(
            bus.on("field:state", (payload: any) => {
              const currentName = context.get("name") || prop("name");
              if (!payload?.name || payload.name === currentName) {
                if (payload.disabled !== undefined) {
                  context.set("fieldDisabled", Boolean(payload.disabled));
                }
                if (payload.size !== undefined) {
                  context.set("fieldSize", payload.size);
                }
              }
            }),
          );

          disposers.push(
            bus.on("form:state", (payload: any) => {
              if (payload?.disabled !== undefined) {
                context.set("formDisabled", Boolean(payload.disabled));
              }
              if (payload?.readOnly !== undefined) {
                context.set("formReadOnly", Boolean(payload.readOnly));
              }
            }),
          );
        }
        refs.set("busDisposers", disposers);

        const origEmitInput = bound.emitInput.bind(bound);
        const origEmitChange = bound.emitChange.bind(bound);
        bound.emitInput = (val: any) => {
          if (!suppressEmit) origEmitInput(val);
        };
        bound.emitChange = (val: any) => {
          if (!suppressEmit) origEmitChange(val);
        };

        refs.set("formField", bound);
      },
      cleanupFormField: ({ refs }) => {
        refs.get("formField")?.dispose();
        refs.set("formField", undefined);
        refs.set("currentFormBus", undefined);
        const disposers = refs.get("busDisposers") ?? [];
        for (let i = 0; i < disposers.length; i++) {
          disposers[i]?.();
        }
        refs.set("busDisposers", []);
      },
    },
  },
});
