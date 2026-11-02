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
      valueText:
        "font-medium text-neutral-500 tabular-nums leading-none text-center",
      view: "relative inline-flex items-center justify-center",
      circle:
        "overflow-visible block box-border rounded-full transition-all duration-300 ease-out",
      circleTrack: "text-neutral-200 stroke-current",
      circleRange:
        "transition-[stroke-dashoffset] duration-300 ease-out stroke-current",
    },
    variants: {
      color: createColorVariants(colors),
      size: {
        "2xs": {
          track: "h-1",
          circle: "size-6",
          label: "text-xs",
          valueText: "text-xs",
        },
        xs: {
          track: "h-1.5",
          circle: "size-8",
          label: "text-xs",
          valueText: "text-xs",
        },
        sm: {
          track: "h-2",
          circle: "size-10",
          label: "text-xs",
          valueText: "text-xs",
        },
        md: {
          track: "h-2.5",
          circle: "size-12",
          label: "text-xs",
          valueText: "text-xs",
        },
        lg: {
          track: "h-3",
          circle: "size-14",
          label: "text-sm",
          valueText: "text-xs",
        },
        xl: {
          track: "h-3.5",
          circle: "size-16",
          label: "text-base",
          valueText: "text-sm",
        },
        "2xl": {
          track: "h-4",
          circle: "size-20",
          label: "text-lg",
          valueText: "text-base",
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
          range: "cui-progress-indeterminate",
          circle: "animate-spin",
        },
        false: {},
      },
      striped: {
        true: {
          range: "cui-progress-striped",
        },
        false: {},
      },
      animated: {
        true: {
          range: "cui-progress-animated",
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
