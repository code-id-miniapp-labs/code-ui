import { createMachine } from "@code-ui/core";
import type { BindableContext, BindableRefs, PropFn } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
import type { CheckboxGroupContext } from "@code-ui/checkbox-group";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  CheckboxContext,
  CheckboxMachine,
  CheckboxProps,
  CheckboxSchema,
} from "./checkbox.types";
import { defaultCheckboxProps } from "./checkbox.props";
import { parseBooleanProp, resolveInitialBooleans } from "./checkbox.utils";

function emitChange(
  context: BindableContext<CheckboxSchema>,
  prop: PropFn<CheckboxSchema>,
  refs: BindableRefs<CheckboxSchema>,
  nextChecked: boolean,
): void {
  const itemVal = context.get("value") || prop("value") || nextChecked;

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

  context: ({ prop, bindable }) => {
    const propBindable = <
      K extends keyof CheckboxContext & keyof CheckboxProps,
    >(
      key: K,
      defaultValue: CheckboxContext[K],
    ) =>
      bindable<CheckboxContext[K]>(() => ({
        value: prop(key) as CheckboxContext[K] | undefined,
        defaultValue,
      }));

    return {
      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      disabled: propBindable("disabled", false),
      readOnly: propBindable("readOnly", false),
      required: propBindable("required", false),
      color: propBindable("color", "primary"),
      size: propBindable("size", "md"),
      value: propBindable("value", ""),
      name: propBindable("name", ""),
      form: propBindable("form", ""),
      label: propBindable("label", ""),
      description: propBindable("description", ""),
      icon: propBindable("icon", "check"),
      indeterminateIcon: propBindable("indeterminateIcon", "minus"),
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
        host?.fieldState(prop("name") || scope.id || "checkbox")?.disabled,
      );
    },
    fieldSize: ({ prop, refs, scope }) => {
      const host = prop("formContext") ?? refs.get("formField")?.host;
      return (
        prop("fieldSize") ||
        host?.fieldState(prop("name") || scope.id || "checkbox")?.size ||
        ""
      );
    },
    isInvalid: ({ prop, refs, context, scope }) => {
      const host = prop("formContext") ?? refs.get("formField")?.host;
      return Boolean(
        prop("groupContext")?.invalid() ||
        context.get("invalid") ||
        host?.errors(prop("name") || scope.id || "checkbox").length,
      );
    },
    isChecked: ({ context, prop, state }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      if (group) {
        return group.value().includes(context.get("value"));
      }
      return state.matches("checked");
    },
    isIndeterminate: ({ state }) => state.matches("indeterminate"),
    isDisabled: ({ context, prop, computed }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      return Boolean(
        computed("formDisabled") ||
        group?.disabled() ||
        computed("fieldDisabled") ||
        context.get("disabled"),
      );
    },
    isReadOnly: ({ context, computed, prop }) =>
      Boolean(
        prop("groupContext")?.readOnly() ||
        context.get("readOnly") ||
        computed("formReadOnly"),
      ),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),
    effectiveSize: ({ context, prop, computed }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      return (group?.size() ||
        computed("fieldSize") ||
        context.get("size")) as CheckboxContext["size"];
    },
    effectiveColor: ({ context, prop }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      return group?.color() || context.get("color");
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

      selectGroup: ({ context, prop }) => {
        const group = prop("groupContext") as CheckboxGroupContext | undefined;
        group?.toggleValue(context.get("value"));
      },

      emitControlledToggle: ({ context, prop, refs, state }) => {
        emitChange(context, prop, refs, !state.matches("checked"));
      },

      emitCheckboxChange: ({ context, prop, refs, state }) => {
        emitChange(context, prop, refs, state.matches("checked"));
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
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () =>
              prop("groupContext")
                ? ""
                : context.get("name") || prop("name") || "",
            getValue: () => computed("isChecked"),
            setValue: (rawVal: unknown) => {
              state.set(rawVal ? "checked" : "unchecked");
            },
            resetValue: () => {
              const initialIndet = Boolean(refs.get("initialIndeterminate"));
              const initialChecked = Boolean(refs.get("initialChecked"));

              context.set("invalid", false);
              state.set(
                initialIndet
                  ? "indeterminate"
                  : initialChecked
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
