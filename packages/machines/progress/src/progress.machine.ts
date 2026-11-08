import { createMachine } from "@code-ui/core";
import type {
  ProgressContext,
  ProgressMachine,
  ProgressOrientation,
  ProgressProps,
  ProgressSchema,
  ProgressType,
} from "./progress.types";
import { defaultProgressProps } from "./progress.props";

const STROKE_WIDTHS: Record<string, number> = {
  "2xs": 2,
  xs: 2.5,
  sm: 3,
  md: 4,
  lg: 5,
  xl: 6,
  "2xl": 7,
};

export const progressMachine: ProgressMachine = createMachine<ProgressSchema>({
  props: ({ props }) => ({
    ...defaultProgressProps,
    ...props,
  }),

  initialState: () => "idle",

  context: ({ prop, bindable }) => {
    const propBindable = <
      K extends keyof ProgressContext & keyof ProgressProps,
    >(
      key: K,
      defaultValue: ProgressContext[K],
    ) =>
      bindable<ProgressContext[K]>(() => ({
        value: prop(key) as ProgressContext[K] | undefined,
        defaultValue,
      }));

    return {
      value: propBindable(
        "value",
        (prop("defaultValue") as number | null) ?? null,
      ),
      min: propBindable("min", 0),
      max: propBindable("max", 100),
      orientation: propBindable(
        "orientation",
        "horizontal" as ProgressOrientation,
      ),
      type: propBindable("type", "linear" as ProgressType),
    };
  },

  computed: {
    isIndeterminate: ({ prop, context }) => {
      const val = context.get("value");
      return Boolean(prop("indeterminate") || val === null || val === undefined);
    },

    percent: ({ context, computed }) => {
      if (computed("isIndeterminate")) return -1;
      const value = context.get("value");
      if (value === null || value === undefined) return -1;
      const min = context.get("min") ?? 0;
      const max = context.get("max") ?? 100;
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
          max: context.get("max") ?? 100,
          percent,
        });
      }
      return computed("isIndeterminate") ? "" : `${percent}%`;
    },

    circleStyle: ({ computed, prop }) => {
      const percent = computed("isIndeterminate")
        ? 25
        : Math.max(0, Math.min(100, computed("percent")));
      const color = prop("color");
      const strokeWidth =
        prop("strokeWidth") ?? STROKE_WIDTHS[prop("size") ?? "md"] ?? 4;
      const trackColor = prop("trackColor");
      let style = `--cui-progress-percent: ${percent}%; --cui-progress-stroke-width: ${strokeWidth}px;`;
      if (trackColor) style += ` --cui-progress-track-color: ${trackColor};`;
      if (
        typeof color === "string" &&
        /^(#|rgb|hsl|oklch)/.test(color)
      ) {
        style += ` color: ${color};`;
      }
      if (prop("inverted")) style += " transform: scaleX(-1);";
      return style;
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
        const defaultVal = (prop("defaultValue") as number | null) ?? null;
        context.set("value", defaultVal);
        prop("onValueChange")?.({
          value: defaultVal,
          percent: computed("percent"),
        });
      },
    },
  },
});
