import { createMachine } from "@code-ui/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-ui/form/context";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  SwitchMachine,
  SwitchSchema,
  SwitchSize,
} from "./switch.types";
import { defaultSwitchProps } from "./switch.props";

const resolveInitialChecked = (prop: any): boolean => {
  const rawChecked = prop("checked");
  return isNotNull(rawChecked)
    ? Boolean(rawChecked)
    : Boolean(prop("defaultChecked"));
};

export const switchMachine: SwitchMachine = createMachine<SwitchSchema>({
  props: ({ props }) => ({
    ...defaultSwitchProps,
    ...props,
  }),

  initialState: ({ prop }) =>
    resolveInitialChecked(prop) ? "checked" : "unchecked",

  refs: ({ prop }) => ({
    initialChecked: resolveInitialChecked(prop),
    formField: undefined,
  }),

  context: ({ prop, bindable }) => ({
    invalid: bindable<boolean>(() => {
      const rawInvalid = prop("invalid");
      return {
        value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
        defaultValue: false,
      };
    }),
  }),

  computed: {
    ...createFormFieldComputed("switch"),
    isInvalid: ({ prop, refs, context, scope }) =>
      Boolean(
        context.get("invalid") ||
          hasFormFieldErrors(prop, refs, scope, "switch"),
      ),
    isChecked: ({ state }) => state.matches("checked"),
    isDisabled: ({ prop, computed }) =>
      Boolean(
        prop("disabled") ||
          computed("formDisabled") ||
          computed("fieldDisabled"),
      ),
    isReadOnly: ({ prop, computed }) =>
      Boolean(prop("readOnly") || computed("formReadOnly")),
    isInteractive: ({ prop, computed }) =>
      !prop("loading") && !computed("isDisabled") && !computed("isReadOnly"),
    effectiveSize: ({ prop, computed }) => {
      const rawSize = prop("size");
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
            getFormId: () => prop("form") || "",
            getName: () => prop("name") || "",
            getValue: () => computed("isChecked"),
            setValue: (rawVal: unknown) => {
              state.set(rawVal ? "checked" : "unchecked");
            },
            resetValue: () => {
              context.set("invalid", false);
              state.set(refs.get("initialChecked") ? "checked" : "unchecked");
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
