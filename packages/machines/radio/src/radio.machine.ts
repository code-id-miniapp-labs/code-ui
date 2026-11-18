import { createMachine } from "@code-id-labs/core";
import type { PropFn } from "@code-id-labs/core";
import type { RadioGroupContext } from "@code-id-labs/radio-group";
import { isNotEmpty, isNotNull } from "@code-id-labs/utils";
import type { RadioMachine, RadioSchema } from "./radio.types";
import { defaultRadioProps } from "./radio.props";

function emitRadioChange(
  prop: PropFn<RadioSchema>,
  nextChecked: boolean,
): void {
  prop("onChange")?.({ value: prop("value"), checked: nextChecked });
}

const selectToCheckedTransition = [
  {
    guard: "hasGroupContext",
    actions: ["selectGroup"],
  },
  {
    guard: "isControlled",
    actions: ["emitControlledSelect"],
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
        return group.value() === prop("value");
      }
      return state.matches("checked");
    },

    isDisabled: ({ prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return Boolean(group?.disabled() || prop("disabled"));
    },

    isReadOnly: ({ prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return Boolean(group?.readOnly() || prop("readOnly"));
    },

    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),

    isInvalid: ({ context, prop }) => {
      const group = prop("groupContext") as RadioGroupContext | undefined;
      return Boolean(context.get("invalid") || group?.invalid());
    },
  },

  watch: ({ prop, state, track }) => {
    track(
      [() => Boolean(prop("groupContext")), () => prop("checked")],
      () => {
        if (prop("groupContext")) return;

        const controlledChecked = prop("checked");
        if (isNotNull(controlledChecked)) {
          const targetState = controlledChecked ? "checked" : "unchecked";
          if (!state.matches(targetState)) {
            state.set(targetState);
          }
        }
      },
    );
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
            guard: "isControlled",
            actions: ["emitControlledToggle"],
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
      isControlled: ({ prop, computed }) =>
        computed("isInteractive") && isNotNull(prop("checked")),
      hasGroupContext: ({ prop, computed }) =>
        computed("isInteractive") && Boolean(prop("groupContext")),
      isEventChecked: ({ event }) =>
        "checked" in event && Boolean(event.checked),
    },

    actions: {
      selectGroup: ({ prop }) => {
        const group = prop("groupContext") as RadioGroupContext | undefined;
        group?.select(prop("value"));
      },

      emitRadioChange: ({ prop, state }) => {
        emitRadioChange(prop, state.matches("checked"));
      },

      emitControlledSelect: ({ prop }) => {
        emitRadioChange(prop, true);
      },

      emitControlledToggle: ({ prop, state }) => {
        emitRadioChange(prop, !state.matches("checked"));
      },
    },
  },
});
