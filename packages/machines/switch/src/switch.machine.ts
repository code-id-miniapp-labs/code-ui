import { createMachine } from "@code-ui/core";
import { setupFormFieldSync, cleanupFormFieldSync } from "@code-ui/form/context";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  SwitchContext,
  SwitchMachine,
  SwitchProps,
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
      currentFormBus: prop("formBus"),
      formField: undefined,
    };
  },

  context: ({ prop, bindable }) => {
    const propBindable = <
      K extends keyof SwitchContext & keyof SwitchProps,
    >(
      key: K,
      defaultValue: SwitchContext[K],
    ) =>
      bindable<SwitchContext[K]>(() => ({
        value: prop(key) as SwitchContext[K] | undefined,
        defaultValue,
      }));

    const stateBindable = <K extends keyof SwitchContext>(
      _key: K,
      defaultValue: SwitchContext[K],
    ) =>
      bindable<SwitchContext[K]>(() => ({
        defaultValue,
      }));

    return {
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
      loading: propBindable("loading", false),
      color: propBindable("color", "primary"),
      size: propBindable("size", "md"),
      value: propBindable("value", "on"),
      name: propBindable("name", ""),
      form: propBindable("form", ""),
      label: propBindable("label", ""),
      description: propBindable("description", ""),
      checkedIcon: propBindable("checkedIcon", ""),
      uncheckedIcon: propBindable("uncheckedIcon", ""),
      loadingIcon: propBindable("loadingIcon", ""),
      ui: propBindable("ui", {}),
    };
  },

  computed: {
    isChecked: ({ state }) => state.matches("checked"),
    isDisabled: ({ context }) =>
      Boolean(
        context.get("disabled") ||
        context.get("formDisabled") ||
        context.get("fieldDisabled"),
      ),
    isReadOnly: ({ context }) =>
      Boolean(context.get("readOnly") || context.get("formReadOnly")),
    isInteractive: ({ context, computed }) =>
      !context.get("loading") &&
      !computed("isDisabled") &&
      !computed("isReadOnly"),
    effectiveSize: ({ context }) => {
      const rawSize = context.get("size");
      const fieldSize = context.get("fieldSize");
      return rawSize && rawSize !== "md"
        ? rawSize
        : ((fieldSize || rawSize || "md") as SwitchSize);
    },
  },

  effects: ["trackProps"],
  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  on: {
    RESET_VALUE: [
      {
        guard: "isInitialChecked",
        target: "checked",
        actions: ["resetInvalid"],
      },
      {
        target: "unchecked",
        actions: ["resetInvalid"],
      },
    ],
    SET_CHECKED: [
      {
        guard: "isEventChecked",
        target: "checked",
      },
      {
        target: "unchecked",
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
          actions: ["emitSwitchChange"],
        },
      },
    },

    checked: {
      tags: ["checked"],
      on: {
        TOGGLE: {
          guard: "isInteractive",
          target: "unchecked",
          actions: ["emitSwitchChange"],
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
      emitSwitchChange: ({ prop, refs, state }) => {
        const nextVal = state.matches("checked");
        prop("onCheckedChange")?.({ checked: nextVal });
        prop("onChange")?.({ checked: nextVal });
        prop("component")?.triggerEvent?.("change", {
          value: nextVal,
          checked: nextVal,
        });
        prop("component")?.setData?.({ checked: nextVal });

        const formField = refs.get("formField");
        if (formField) {
          formField.emitInput(nextVal);
          formField.emitChange(nextVal);
        }
      },
      resetInvalid: ({ context }) => {
        context.set("invalid", false);
      },
      setupFormField: ({ context, prop, refs, scope, state, computed }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            bus: prop("formBus"),
            id: scope.id ?? "switch",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () => context.get("name") || prop("name") || "",
            getValue: () => computed("isChecked"),
            setValue: (rawVal: unknown) => {
              state.set(rawVal ? "checked" : "unchecked");
            },
            resetValue: () => {
              const initial = Boolean(refs.get("initialChecked"));
              context.set("invalid", false);
              state.set(initial ? "checked" : "unchecked");
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

    effects: {
      trackProps: ({ prop, refs, state, track }) => {
        let initial = true;
        track(
          [() => Boolean(prop("formBus")), () => prop("checked")],
          () => {
            if (initial) {
              initial = false;
              return;
            }
            const controlledChecked = prop("checked");
            if (isNotNull(controlledChecked)) {
              const targetState = controlledChecked ? "checked" : "unchecked";
              if (state.get() !== targetState) state.set(targetState);
            }
            const nextFormBus = prop("formBus");
            if (nextFormBus !== refs.get("currentFormBus")) {
              refs.set("currentFormBus", nextFormBus);
              refs.get("formField")?.rebind(nextFormBus ?? null);
            }
          },
        );
      },
    },
  },
});
