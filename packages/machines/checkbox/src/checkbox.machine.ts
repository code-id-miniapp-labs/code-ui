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
      currentFormBus: prop("formBus"),
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

    const stateBindable = <K extends keyof CheckboxContext>(
      _key: K,
      defaultValue: CheckboxContext[K],
    ) =>
      bindable<CheckboxContext[K]>(() => ({
        defaultValue,
      }));

    return {
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
    isChecked: ({ context, prop, state }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      if (group) {
        return group.value().includes(context.get("value"));
      }
      return state.matches("checked");
    },
    isIndeterminate: ({ state }) => state.matches("indeterminate"),
    isDisabled: ({ context, prop }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      return Boolean(
        context.get("formDisabled") ||
          group?.disabled() ||
          context.get("fieldDisabled") ||
          context.get("disabled"),
      );
    },
    isReadOnly: ({ context }) =>
      Boolean(context.get("readOnly") || context.get("formReadOnly")),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),
    isInvalid: ({ context, prop }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      return Boolean(group?.invalid() || context.get("invalid"));
    },
    effectiveSize: ({ context, prop }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      return group?.size() || context.get("fieldSize") || context.get("size");
    },
    effectiveColor: ({ context, prop }) => {
      const group = prop("groupContext") as CheckboxGroupContext | undefined;
      return group?.color() || context.get("color");
    },
  },

  watch: ({ prop, refs, state }) => {
    const nextFormBus = prop("formBus");
    if (nextFormBus !== refs.get("currentFormBus")) {
      refs.set("currentFormBus", nextFormBus);
      refs.get("formField")?.rebind(nextFormBus ?? null);
    }

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
        const group = prop("groupContext") as
          | CheckboxGroupContext
          | undefined;
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
            bus: prop("formBus"),
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
