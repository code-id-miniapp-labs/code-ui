import { createMachine } from "@code-ui/core";
import type { PropFn } from "@code-ui/core";
import type { RadioGroupContext } from "@code-ui/radio-group";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type { RadioMachine, RadioSchema } from "./radio.types";
import { defaultRadioProps } from "./radio.props";

function emitRadioChange(
  prop: PropFn<RadioSchema>,
  nextChecked: boolean,
): void {
  prop("onChange")?.({ value: prop("value") || "", checked: nextChecked });
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
    isChecked: ({ prop, state }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      if (group) {
        return group.value() === (prop("value") ?? "");
      }
      return state.matches("checked");
    },

    isDisabled: ({ prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return Boolean(group?.disabled() || prop("disabled"));
    },

    isInteractive: ({ computed, prop }) =>
      !computed("isDisabled") && !prop("readOnly"),

    isInvalid: ({ context, prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return Boolean(context.get("invalid") || group?.invalid());
    },

    effectiveSize: ({ prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return group?.size() || prop("size") || "md";
    },

    effectiveColor: ({ prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return group?.color() || prop("color") || "primary";
    },

    effectiveVariant: ({ prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return group?.variant() || prop("variant") || "outline";
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
      selectGroup: ({ prop }) => {
        const group = prop("groupContext") as RadioGroupContext | undefined;
        group?.select(prop("value") ?? "");
      },

      emitRadioChange: ({ prop, state }) => {
        emitRadioChange(prop, state.matches("checked"));
      },
    },
  },
});
