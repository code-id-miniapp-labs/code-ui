import { createMachine } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
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
      formField: undefined,
    };
  },

  context: ({ prop, bindable }) => {
    const propBindable = <K extends keyof SwitchContext & keyof SwitchProps>(
      key: K,
      defaultValue: SwitchContext[K],
    ) =>
      bindable<SwitchContext[K]>(() => ({
        value: prop(key) as SwitchContext[K] | undefined,
        defaultValue,
      }));

    return {
      disabled: propBindable("disabled", false),
      readOnly: propBindable("readOnly", false),

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
    formDisabled: ({ prop, refs }) => {
      const host = prop("formContext") ?? refs.get("formField")?.host;
      return host?.disabled() ?? false;
    },
    formReadOnly: ({ prop, refs }) => {
      const host = prop("formContext") ?? refs.get("formField")?.host;
      return host?.readOnly() ?? false;
    },
    fieldDisabled: ({ prop, refs, scope }) => {
      const host = prop("formContext") ?? refs.get("formField")?.host;
      return Boolean(
        prop("fieldDisabled") ||
        host?.fieldState(prop("name") || scope.id || "switch")?.disabled,
      );
    },
    fieldSize: ({ prop, refs, scope }) => {
      const host = prop("formContext") ?? refs.get("formField")?.host;
      return (
        prop("fieldSize") ||
        host?.fieldState(prop("name") || scope.id || "switch")?.size ||
        ""
      );
    },
    isInvalid: ({ prop, refs, context, scope }) => {
      const host = prop("formContext") ?? refs.get("formField")?.host;
      return Boolean(
        context.get("invalid") ||
        host?.errors(prop("name") || scope.id || "switch").length,
      );
    },
    isChecked: ({ state }) => state.matches("checked"),
    isDisabled: ({ context, computed }) =>
      Boolean(
        context.get("disabled") ||
        computed("formDisabled") ||
        computed("fieldDisabled"),
      ),
    isReadOnly: ({ context, computed }) =>
      Boolean(context.get("readOnly") || computed("formReadOnly")),
    isInteractive: ({ context, computed }) =>
      !context.get("loading") &&
      !computed("isDisabled") &&
      !computed("isReadOnly"),
    effectiveSize: ({ context, computed }) => {
      const rawSize = context.get("size");
      const fieldSize = computed("fieldSize");
      return rawSize && rawSize !== "md"
        ? rawSize
        : ((fieldSize || rawSize || "md") as SwitchSize);
    },
  },

  watch: ({ prop, state }) => {
    const controlledChecked = prop("checked");
    if (isNotNull(controlledChecked)) {
      const targetState = controlledChecked ? "checked" : "unchecked";
      if (!state.matches(targetState)) state.set(targetState);
    }
  },

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
        prop("onChange")?.({ checked: nextVal });

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
            getHost: () => prop("formContext"),
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
    },
  },
});
