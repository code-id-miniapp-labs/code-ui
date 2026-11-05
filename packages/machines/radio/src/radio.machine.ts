import { createMachine } from "@code-ui/core";
import type { BindableContext, PropFn } from "@code-ui/core";
import type { RadioGroupContext } from "@code-ui/radio-group";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  RadioContext,
  RadioMachine,
  RadioProps,
  RadioSchema,
} from "./radio.types";
import { defaultRadioProps } from "./radio.props";

function emitRadioChange(
  context: BindableContext<RadioSchema>,
  prop: PropFn<RadioSchema>,
  nextChecked: boolean,
): void {
  const value = context.get("value") || prop("value") || "";
  prop("onChange")?.({ value, checked: nextChecked });
}

const selectToCheckedTransition = [
  {
    guard: "hasGroupContext",
    actions: ["selectGroup"],
  },
  {
    guard: "isInteractive",
    target: "checked" as const,
    actions: ["emitRadioChange"],
  },
];

export const radioMachine: RadioMachine = createMachine<RadioSchema>({
  props: ({ props }) => ({
    ...defaultRadioProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const group = prop("groupContext") as RadioGroupContext | undefined;
    if (group) {
      return group.value() === prop("value") ? "checked" : "unchecked";
    }
    const rawChecked = prop("checked");
    const initial = isNotNull(rawChecked)
      ? Boolean(rawChecked)
      : Boolean(prop("defaultChecked"));
    return initial ? "checked" : "unchecked";
  },

  context: ({ prop, bindable }) => {
    const propBindable = <
      K extends keyof RadioContext & keyof RadioProps,
    >(
      key: K,
      defaultValue: RadioContext[K],
    ) =>
      bindable<RadioContext[K]>(() => ({
        value: prop(key) as RadioContext[K] | undefined,
        defaultValue,
      }));

    return {
      value: propBindable("value", ""),
      label: propBindable("label", ""),
      description: propBindable("description", ""),
      disabled: propBindable("disabled", false),
      readOnly: propBindable("readOnly", false),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      color: propBindable("color", ""),
      size: propBindable("size", ""),
      variant: propBindable("variant", "outline"),

      ui: propBindable("ui", {}),
    };
  },

  computed: {
    isChecked: ({ context, prop, state }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      if (group) {
        return group.value() === context.get("value");
      }
      return state.matches("checked");
    },

    isDisabled: ({ context, prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return Boolean(group?.disabled() || context.get("disabled"));
    },

    isInteractive: ({ computed, context }) =>
      !computed("isDisabled") && !context.get("readOnly"),

    isInvalid: ({ context, prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return Boolean(context.get("invalid") || group?.invalid());
    },

    effectiveSize: ({ context, prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return group?.size() || context.get("size") || "md";
    },

    effectiveColor: ({ context, prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return group?.color() || context.get("color") || "primary";
    },

    effectiveVariant: ({ context, prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return group?.variant() || context.get("variant") || "outline";
    },
  },

  watch: ({ prop, state }) => {
    if (prop("groupContext")) return;

    const controlledChecked = prop("checked");
    if (isNotNull(controlledChecked)) {
      const targetState = controlledChecked ? "checked" : "unchecked";
      if (!state.matches(targetState)) {
        state.set(targetState);
      }
    }
  },

  on: {
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
        SELECT: selectToCheckedTransition,
        TOGGLE: selectToCheckedTransition,
      },
    },
    checked: {
      tags: ["checked"],
      on: {
        SELECT: {
          guard: "hasGroupContext",
          actions: ["selectGroup"],
        },
        TOGGLE: [
          {
            guard: "hasGroupContext",
            actions: ["selectGroup"],
          },
          {
            guard: "isInteractive",
            target: "unchecked",
            actions: ["emitRadioChange"],
          },
        ],
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
      hasGroupContext: ({ prop, computed }) =>
        computed("isInteractive") && Boolean(prop("groupContext")),
      isEventChecked: ({ event }) =>
        "checked" in event && Boolean(event.checked),
    },

    actions: {
      selectGroup: ({ context, prop }) => {
        const group = prop("groupContext") as RadioGroupContext | undefined;
        group?.select(context.get("value"));
      },

      emitRadioChange: ({ context, prop, state }) => {
        emitRadioChange(context, prop, state.matches("checked"));
      },
    },
  },
});
