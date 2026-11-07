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
import { createCircleDataUrl, resolveColor } from "./progress.utils";

const DEFAULT_STROKE_WIDTHS: Record<string, number> = {
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
    isIndeterminate: ({ prop }) => {
      return prop("indeterminate") ?? false;
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

    progressState: ({ computed }) => {
      if (computed("isIndeterminate")) return "indeterminate";
      if (computed("isComplete")) return "complete";
      return "loading";
    },

    valueAsString: ({ context, computed, prop }) => {
      const isIndeterminate = computed("isIndeterminate");
      const percent = computed("percent");
      const max = context.get("max") ?? 100;
      const value = context.get("value");
      const translations = prop("translations");

      if (translations?.value) {
        return translations.value({ value, max, percent });
      }

      if (isIndeterminate) return "";
      return `${percent}%`;
    },

    circleRadius: ({ prop }) => prop("circleRadius") ?? 42,

    circleCircumference: ({ computed }) => {
      const r = computed("circleRadius");
      return 2 * Math.PI * r;
    },

    circleDashOffset: ({ computed }) => {
      if (computed("isIndeterminate")) return 0;
      const circumference = computed("circleCircumference");
      const percent = computed("percent");
      return circumference - (percent / 100) * circumference;
    },

    circleDataUrl: ({ computed, prop }) => {
      const radius = computed("circleRadius");
      const strokeWidth = prop("strokeWidth") ?? 8;
      const color = resolveColor(prop("color") ?? "primary");
      const trackColor = resolveColor(prop("trackColor") ?? "#e5e7eb");
      const isIndeterminate = computed("isIndeterminate");
      const percent = computed("percent");

      return createCircleDataUrl(
        radius,
        strokeWidth,
        trackColor,
        color,
        percent,
        isIndeterminate,
      );
    },

    circleStyle: ({ computed, prop }) => {
      const isIndeterminate = computed("isIndeterminate");
      const percent = isIndeterminate
        ? 25
        : Math.max(0, Math.min(100, computed("percent")));
      const color = prop("color");
      const size = prop("size") ?? "md";
      const strokeWidth =
        prop("strokeWidth") ?? DEFAULT_STROKE_WIDTHS[size] ?? 4;
      const trackColor = prop("trackColor");
      const inverted = prop("inverted");

      const parts: string[] = [
        `--cui-progress-percent: ${percent}%;`,
        `--cui-progress-stroke-width: ${strokeWidth}px;`,
      ];
      if (trackColor) {
        parts.push(`--cui-progress-track-color: ${trackColor};`);
      }
      if (
        typeof color === "string" &&
        (color.startsWith("#") ||
          color.startsWith("rgb") ||
          color.startsWith("hsl") ||
          color.startsWith("oklch"))
      ) {
        parts.push(`color: ${color};`);
      }
      if (inverted) {
        parts.push("transform: scaleX(-1);");
      }
      return parts.join(" ");
    },
  },

  on: {
    SET_VALUE: {
      actions: ["setValue"],
    },
    "VALUE.SET": {
      actions: ["setValue"],
    },
    SET_MIN: {
      actions: ["setMin"],
    },
    SET_MAX: {
      actions: ["setMax"],
    },
    RESET: {
      actions: ["resetValue"],
    },
  },

  states: {
    idle: {
      tags: ["idle"],
    },
  },

  implementations: {
    actions: {
      setValue: ({ context, event, prop, computed }) => {
        if (event.type !== "SET_VALUE" && event.type !== "VALUE.SET") return;
        context.set("value", event.value);
        const percent = computed("percent");
        prop("onValueChange")?.({ value: event.value, percent });
      },
      setMin: ({ context, event }) => {
        if (event.type !== "SET_MIN") return;
        context.set("min", event.min);
      },
      setMax: ({ context, event }) => {
        if (event.type !== "SET_MAX") return;
        context.set("max", event.max);
      },
      resetValue: ({ context, prop, computed }) => {
        const defaultVal = (prop("defaultValue") as number | null) ?? null;
        context.set("value", defaultVal);
        const percent = computed("percent");
        prop("onValueChange")?.({ value: defaultVal, percent });
      },
    },
  },
});
