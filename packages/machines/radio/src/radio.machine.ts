import { createMachine } from "@code-ui/core";
import type { BindableContext, BindableRefs, PropFn } from "@code-ui/core";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type { EventBus } from "@code-ui/utils";
import type {
  RadioColor,
  RadioContext,
  RadioGroupBusEvents,
  RadioGroupChangePayload,
  RadioMachine,
  RadioParams,
  RadioProps,
  RadioSchema,
  RadioSize,
  RadioVariant,
} from "./radio.types";
import { defaultRadioProps } from "./radio.props";

interface GroupSnapshot {
  value?: string | null | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  color?: RadioColor | "" | undefined;
  size?: RadioSize | "" | undefined;
  variant?: RadioVariant | "" | undefined;
}

function applyGroupState(
  { context, state }: Pick<RadioParams, "context" | "state">,
  g: GroupSnapshot,
): void {
  if (g.value !== undefined) {
    context.set("groupValue", g.value);
    const targetState = g.value === context.get("value") ? "checked" : "unchecked";
    if (!state.matches(targetState)) {
      state.set(targetState);
    }
  }
  if (g.disabled !== undefined) {
    context.set("groupDisabled", Boolean(g.disabled));
  }
  if (g.invalid !== undefined) {
    context.set("groupInvalid", Boolean(g.invalid));
  }
  if (g.color !== undefined) {
    context.set("groupColor", g.color);
  }
  if (g.size !== undefined) {
    context.set("groupSize", g.size);
  }
  if (g.variant !== undefined) {
    context.set("groupVariant", g.variant);
  }
}

function bindGroupBus(
  bus: EventBus<RadioGroupBusEvents> | undefined,
  context: BindableContext<RadioSchema>,
  state: RadioParams["state"],
  refs: BindableRefs<RadioSchema>,
): void {
  for (const d of refs.get("busDisposers") ?? []) d?.();
  refs.set("currentGroupBus", bus);
  refs.set(
    "busDisposers",
    bus
      ? [
          bus.on("group:change", (gState: RadioGroupChangePayload) => {
            applyGroupState({ context, state }, gState);
          }),
        ]
      : [],
  );
}

function emitRadioChange(
  context: BindableContext<RadioSchema>,
  prop: PropFn<RadioSchema>,
  nextChecked: boolean,
): void {
  const value = context.get("value") || prop("value") || "";
  prop("onChange")?.({ value, checked: nextChecked });
  prop("component")?.triggerEvent?.("change", {
    value,
    checked: nextChecked,
  });
  prop("component")?.setData?.({ checked: nextChecked });
}

const selectToCheckedTransition = [
  {
    guard: "hasGroupBus",
    actions: ["selectGroupBus"],
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
    const groupVal = prop("groupValue");
    if (groupVal !== undefined) {
      return groupVal === prop("value") ? "checked" : "unchecked";
    }
    const rawChecked = prop("checked");
    const initial = isNotNull(rawChecked)
      ? Boolean(rawChecked)
      : Boolean(prop("defaultChecked"));
    return initial ? "checked" : "unchecked";
  },

  refs: ({ prop }) => ({
    currentGroupBus: prop("groupBus"),
    busDisposers: [],
  }),

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

    const stateBindable = <K extends keyof RadioContext>(
      _key: K,
      defaultValue: RadioContext[K],
    ) =>
      bindable<RadioContext[K]>(() => ({
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

      groupValue: stateBindable("groupValue", prop("groupValue")),
      groupDisabled: stateBindable(
        "groupDisabled",
        Boolean(prop("groupDisabled")),
      ),
      groupInvalid: stateBindable(
        "groupInvalid",
        Boolean(prop("groupInvalid")),
      ),
      groupColor: stateBindable("groupColor", prop("groupColor") ?? ""),
      groupSize: stateBindable("groupSize", prop("groupSize") ?? ""),
      groupVariant: stateBindable("groupVariant", prop("groupVariant") ?? ""),

      ui: propBindable("ui", {}),
    };
  },

  computed: {
    isChecked: ({ context, state }) => {
      const gv = context.get("groupValue");
      if (gv !== undefined) {
        return gv === context.get("value");
      }
      return state.matches("checked");
    },

    isDisabled: ({ context }) =>
      Boolean(context.get("groupDisabled") || context.get("disabled")),

    isInteractive: ({ computed, context }) =>
      !computed("isDisabled") && !context.get("readOnly"),

    isInvalid: ({ context }) =>
      Boolean(context.get("invalid") || context.get("groupInvalid")),

    effectiveSize: ({ context }) =>
      context.get("groupSize") || context.get("size") || "md",

    effectiveColor: ({ context }) =>
      context.get("groupColor") || context.get("color") || "primary",

    effectiveVariant: ({ context }) =>
      context.get("groupVariant") || context.get("variant") || "outline",
  },

  watch: ({ prop, context, refs, state }) => {
    const nextBus = prop("groupBus");
    if (nextBus !== refs.get("currentGroupBus")) {
      bindGroupBus(nextBus, context, state, refs);
      if (nextBus) {
        applyGroupState(
          { context, state },
          {
            value: prop("groupValue"),
            disabled: prop("groupDisabled"),
            invalid: prop("groupInvalid"),
            color: prop("groupColor"),
            size: prop("groupSize"),
            variant: prop("groupVariant"),
          },
        );
      }
    }

    if (nextBus) return;

    const groupVal = prop("groupValue");
    if (groupVal !== undefined) {
      context.set("groupValue", groupVal);
      const targetState = groupVal === prop("value") ? "checked" : "unchecked";
      if (!state.matches(targetState)) {
        state.set(targetState);
      }
      return;
    }

    const controlledChecked = prop("checked");
    if (isNotNull(controlledChecked)) {
      const targetState = controlledChecked ? "checked" : "unchecked";
      if (!state.matches(targetState)) {
        state.set(targetState);
      }
    }
  },

  entry: ["setupGroupBus"],
  exit: ["cleanupGroupBus"],

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
          guard: "hasGroupBus",
          actions: ["selectGroupBus"],
        },
        TOGGLE: [
          {
            guard: "hasGroupBus",
            actions: ["selectGroupBus"],
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
      hasGroupBus: ({ refs, prop, computed }) =>
        computed("isInteractive") &&
        Boolean(refs.get("currentGroupBus") || prop("groupBus")),
      isEventChecked: ({ event }) =>
        "checked" in event && Boolean(event.checked),
    },

    actions: {
      selectGroupBus: ({ context, refs, prop }) => {
        const bus = refs.get("currentGroupBus") || prop("groupBus");
        bus?.emit("radio:select", { value: context.get("value") });
      },

      emitRadioChange: ({ context, prop, state }) => {
        emitRadioChange(context, prop, state.matches("checked"));
      },

      setupGroupBus: ({ prop, context, state, refs }) => {
        const bus = prop("groupBus");
        if (bus) {
          bindGroupBus(bus, context, state, refs);
        }
      },

      cleanupGroupBus: ({ context, state, refs }) => {
        bindGroupBus(undefined, context, state, refs);
      },
    },
  },
});
