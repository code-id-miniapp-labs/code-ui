import { createMachine } from "@code-id-labs/core";
import type { ProgressMachine, ProgressSchema } from "./progress.types";
import { defaultProgressProps } from "./progress.props";

export const progressMachine: ProgressMachine = createMachine<ProgressSchema>({
  props: ({ props }) => ({
    ...defaultProgressProps,
    ...props,
  }),

  initialState: () => "idle",

  context: ({ prop, bindable }) => ({
    value: bindable<number | null>(() => ({
      value: prop("value"),
      defaultValue: prop("defaultValue"),
    })),
    min: bindable<number>(() => ({
      value: prop("min"),
      defaultValue: defaultProgressProps.min,
    })),
    max: bindable<number>(() => ({
      value: prop("max"),
      defaultValue: defaultProgressProps.max,
    })),
  }),

  computed: {
    isIndeterminate: ({ prop, context }) => {
      const val = context.get("value");
      return Boolean(prop("indeterminate") || val === null || val === undefined);
    },

    percent: ({ context, computed }) => {
      if (computed("isIndeterminate")) return -1;
      const value = context.get("value");
      if (value === null || value === undefined) return -1;
      const min = context.get("min");
      const max = context.get("max");
      if (max <= min) return 0;
      const clamped = Math.min(Math.max(value, min), max);
      return Math.round(((clamped - min) / (max - min)) * 100);
    },

    isComplete: ({ computed }) => computed("percent") >= 100,

    progressState: ({ computed }) =>
      computed("isIndeterminate")
        ? "indeterminate"
        : computed("isComplete")
          ? "complete"
          : "loading",

    valueAsString: ({ context, computed, prop }) => {
      const percent = computed("percent");
      const fmt = prop("translations")?.value;
      if (fmt) {
        return fmt({
          value: context.get("value"),
          max: context.get("max"),
          percent,
        });
      }
      return computed("isIndeterminate") ? "" : `${percent}%`;
    },
  },

  on: {
    SET_VALUE: { actions: ["setValue"] },
    "VALUE.SET": { actions: ["setValue"] },
    SET_MIN: { actions: ["setMin"] },
    SET_MAX: { actions: ["setMax"] },
    RESET: { actions: ["resetValue"] },
  },

  states: {
    idle: { tags: ["idle"] },
  },

  implementations: {
    actions: {
      setValue: ({ context, event, prop, computed }) => {
        if (event.type !== "SET_VALUE" && event.type !== "VALUE.SET") return;
        context.set("value", event.value);
        prop("onValueChange")?.({
          value: event.value,
          percent: computed("percent"),
        });
      },
      setMin: ({ context, event }) => {
        if (event.type === "SET_MIN") context.set("min", event.min);
      },
      setMax: ({ context, event }) => {
        if (event.type === "SET_MAX") context.set("max", event.max);
      },
      resetValue: ({ context, prop, computed }) => {
        const defaultVal = prop("defaultValue");
        context.set("value", defaultVal);
        prop("onValueChange")?.({
          value: defaultVal,
          percent: computed("percent"),
        });
      },
    },
  },
});
