import { createMachine } from "@code-ui/core";
import type { BindableRefs, PropFn } from "@code-ui/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-ui/form/context";
import type { CheckboxGroupContext } from "@code-ui/checkbox-group";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  CheckboxMachine,
  CheckboxSchema,
  CheckboxSize,
} from "./checkbox.types";
import { defaultCheckboxProps } from "./checkbox.props";
import { parseBooleanProp, resolveInitialBooleans } from "./checkbox.utils";

function emitChange(
  prop: PropFn<CheckboxSchema>,
  refs: BindableRefs<CheckboxSchema>,
  nextChecked: boolean,
): void {
  const itemVal = prop("value") || nextChecked;

  prop("onChange")?.({ value: itemVal, checked: nextChecked });

  const formField = refs.get("formField");
  if (formField) {
    formField.emitInput(nextChecked);
    formField.emitChange(nextChecked);
  }
}

const toggleToCheckedTransition = [
  {
    guard: "hasGroupContext",
    actions: ["selectGroup"],
  },
  {
    guard: "isControlled",
    actions: ["emitControlledToggle"],
  },
  {
    guard: "isInteractive",
    target: "checked" as const,
    actions: ["emitCheckboxChange"],
  },
];

export const checkboxMachine: CheckboxMachine = createMachine<CheckboxSchema>({
  props: ({ props }) => ({
    ...defaultCheckboxProps,
    ...props,
  }),

  initialState: ({ prop }) => resolveInitialBooleans(prop).initialState,

  refs: ({ prop }) => {
    const { initialChecked, initialIndeterminate } =
      resolveInitialBooleans(prop);

    return {
      initialChecked,
      initialIndeterminate,
      lastChecked: initialChecked,
      formField: undefined,
    };
  },

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
    ...createFormFieldComputed("checkbox"),
    isInvalid: ({ prop, refs, context, scope }) =>
      Boolean(
        prop("groupContext")?.invalid() ||
          context.get("invalid") ||
          hasFormFieldErrors(prop, refs, scope, "checkbox"),
      ),
    isChecked: ({ prop, state }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      if (group) {
        return group.value().includes(prop("value") ?? "");
      }
      return state.matches("checked");
    },
    isIndeterminate: ({ state }) => state.matches("indeterminate"),
    isDisabled: ({ prop, computed }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      return Boolean(
        computed("formDisabled") ||
          group?.disabled() ||
          computed("fieldDisabled") ||
          prop("disabled"),
      );
    },
    isReadOnly: ({ computed, prop }) =>
      Boolean(
        prop("groupContext")?.readOnly() ||
          prop("readOnly") ||
          computed("formReadOnly"),
      ),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),
    effectiveSize: ({ prop, computed }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      return (group?.size() ||
        computed("fieldSize") ||
        prop("size") ||
        "md") as CheckboxSize;
    },
    effectiveColor: ({ prop }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      return group?.color() || prop("color") || "primary";
    },
  },

  watch: ({ prop, refs, state }) => {

    if (prop("groupContext")) return;

    const controlledIndeterminate = prop("indeterminate");
    if (isNotNull(controlledIndeterminate)) {
      if (parseBooleanProp(controlledIndeterminate)) {
        if (!state.matches("indeterminate")) state.set("indeterminate");
      } else if (state.matches("indeterminate")) {
        const chk = isNotNull(prop("checked"))
          ? parseBooleanProp(prop("checked"))
          : Boolean(refs.get("lastChecked"));
        state.set(chk ? "checked" : "unchecked");
      }
    }

    const controlledChecked = prop("checked");
    if (isNotNull(controlledChecked) && !state.matches("indeterminate")) {
      const targetState = parseBooleanProp(controlledChecked)
        ? "checked"
        : "unchecked";
      if (!state.matches(targetState)) state.set(targetState);
    }
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  on: {
    RESET_VALUE: [
      {
        guard: "isInitialIndeterminate",
        target: "indeterminate",
        actions: ["resetInvalid"],
      },
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
    SET_INDETERMINATE: [
      {
        guard: "isEventIndeterminate",
        target: "indeterminate",
      },
      {
        guard: "wasChecked",
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
      entry: ["recordLastChecked"],
      on: {
        TOGGLE: toggleToCheckedTransition,
      },
    },

    checked: {
      tags: ["checked"],
      entry: ["recordLastChecked"],
      on: {
        TOGGLE: [
          {
            guard: "hasGroupContext",
            actions: ["selectGroup"],
          },
          {
            guard: "isControlled",
            actions: ["emitControlledToggle"],
          },
          {
            guard: "isInteractive",
            target: "unchecked",
            actions: ["emitCheckboxChange"],
          },
        ],
      },
    },

    indeterminate: {
      tags: ["indeterminate"],
      on: {
        TOGGLE: toggleToCheckedTransition,
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
      hasGroupContext: ({ prop, computed }) =>
        computed("isInteractive") && Boolean(prop("groupContext")),
      isControlled: ({ prop, computed }) =>
        computed("isInteractive") && isNotNull(prop("checked")),
      wasChecked: ({ refs }) => Boolean(refs.get("lastChecked")),
      isEventChecked: ({ event }) =>
        "checked" in event && Boolean(event.checked),
      isEventIndeterminate: ({ event }) =>
        "indeterminate" in event && Boolean(event.indeterminate),
      isInitialChecked: ({ refs }) => Boolean(refs.get("initialChecked")),
      isInitialIndeterminate: ({ refs }) =>
        Boolean(refs.get("initialIndeterminate")),
    },

    actions: {
      recordLastChecked: ({ refs, state }) => {
        refs.set("lastChecked", state.matches("checked"));
      },

      selectGroup: ({ prop }) => {
        const group = prop("groupContext") as CheckboxGroupContext | undefined;
        group?.toggleValue(prop("value") ?? "");
      },

      emitControlledToggle: ({ prop, refs, state }) => {
        emitChange(prop, refs, !state.matches("checked"));
      },

      emitCheckboxChange: ({ prop, refs, state }) => {
        emitChange(prop, refs, state.matches("checked"));
      },

      resetInvalid: ({ context }) => {
        context.set("invalid", false);
      },

      setupFormField: ({ context, prop, refs, scope, state, computed }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            getHost: () => prop("formContext"),
            id: scope.id ?? "checkbox",
            getFormId: () => prop("form") || "",
            getName: () => (prop("groupContext") ? "" : prop("name") || ""),
            getValue: () => computed("isChecked"),
            setValue: (rawVal: unknown) => {
              state.set(rawVal ? "checked" : "unchecked");
            },
            resetValue: () => {
              context.set("invalid", false);
              state.set(
                refs.get("initialIndeterminate")
                  ? "indeterminate"
                  : refs.get("initialChecked")
                    ? "checked"
                    : "unchecked",
              );
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
