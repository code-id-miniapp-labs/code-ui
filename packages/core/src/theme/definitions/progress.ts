import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function progressTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "relative select-none",
      track: "overflow-hidden rounded-full bg-neutral-200 transition-colors",
      range: "rounded-full transition-all duration-300 ease-out",
      label: "font-medium text-neutral-900",
      valueText: "font-medium text-neutral-500 tabular-nums",
      view: "relative inline-flex items-center justify-center",
      circle: "overflow-visible",
      circleTrack: "text-neutral-200 stroke-current",
      circleRange: "transition-[stroke-dashoffset] duration-300 ease-out stroke-current",
    },
    variants: {
      color: createColorVariants(colors),
      size: {
        "2xs": {
          track: "h-1",
          circle: "w-6 h-6",
          label: "text-xs",
          valueText: "text-[10px]",
        },
        xs: {
          track: "h-1.5",
          circle: "w-8 h-8",
          label: "text-xs",
          valueText: "text-xs",
        },
        sm: {
          track: "h-2",
          circle: "w-10 h-10",
          label: "text-xs",
          valueText: "text-xs",
        },
        md: {
          track: "h-2.5",
          circle: "w-12 h-12",
          label: "text-sm",
          valueText: "text-sm",
        },
        lg: {
          track: "h-3",
          circle: "w-14 h-14",
          label: "text-base",
          valueText: "text-base",
        },
        xl: {
          track: "h-3.5",
          circle: "w-16 h-16",
          label: "text-lg",
          valueText: "text-lg",
        },
        "2xl": {
          track: "h-4",
          circle: "w-20 h-20",
          label: "text-xl",
          valueText: "text-xl",
        },
      },
      orientation: {
        horizontal: {
          root: "w-full flex flex-col",
          track: "w-full",
          range: "h-full",
        },
        vertical: {
          root: "h-full flex flex-row items-end",
          track: "h-full",
          range: "w-full",
        },
      },
      type: {
        linear: {
          root: "w-full",
          view: "hidden",
        },
        circular: {
          root: "inline-flex items-center justify-center relative",
          track: "hidden",
        },
      },
      indeterminate: {
        true: {
          range: "animate-[progress-carousel_2s_ease-in-out_infinite]",
          circle: "animate-spin",
        },
        false: {},
      },
      striped: {
        true: {
          range:
            "bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]",
        },
        false: {},
      },
      animated: {
        true: {
          range: "animate-[progress-stripes_1s_linear_infinite]",
        },
        false: {},
      },
      inverted: {
        true: {
          track: "rotate-180",
        },
        false: {},
      },
    },
    compoundVariants: (colors as readonly string[]).map((color) => ({
      color: color as (typeof colors)[number],
      class: {
        range: `bg-${color}`,
        circleRange: `text-${color}`,
      },
    })),
    defaultVariants: {
      color: "primary",
      size: "md",
      type: "linear",
      orientation: "horizontal",
      indeterminate: false,
      striped: false,
      animated: false,
      inverted: false,
    },
  });
}
