import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function sliderTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative inline-flex flex-col gap-1.5 w-full select-none touch-none",
      wrapper: "flex items-center justify-between",
      label: "block font-medium text-highlighted leading-snug",
      valueText: "text-muted font-medium tabular-nums",
      control: "relative flex items-center cursor-pointer",
      track: "relative bg-accented rounded-full grow overflow-hidden",
      range: "absolute rounded-full transition-all duration-75",
      thumb:
        "absolute rounded-full bg-white shadow-md ring-1 ring-black/5 flex items-center justify-center transition-[transform,shadow] duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      markerGroup: "absolute inset-0 pointer-events-none",
      marker:
        "absolute flex flex-col items-center text-dimmed font-medium",
      markerTick: "w-1 h-1 rounded-full bg-default",
      markerTickActive: "bg-white/90",
      markerLabel: "mt-2 tabular-nums select-none",
      markerLabelActive: "text-default font-semibold",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(colors.map((color) => [color, {}])),
        { neutral: {} },
      ),
      size: {
        xs: {
          control: "h-4",
          track: "h-1",
          thumb: "w-3 h-3",
          label: "text-xs",
          valueText: "text-xs",
          marker: "text-2xs",
        },
        sm: {
          control: "h-4.5",
          track: "h-1.5",
          thumb: "w-3.5 h-3.5",
          label: "text-xs",
          valueText: "text-xs",
          marker: "text-2xs",
        },
        md: {
          control: "h-5",
          track: "h-2",
          thumb: "w-4 h-4",
          label: "text-sm",
          valueText: "text-sm",
          marker: "text-xs",
        },
        lg: {
          control: "h-6",
          track: "h-2.5",
          thumb: "w-5 h-5",
          label: "text-base",
          valueText: "text-base",
          marker: "text-sm",
        },
        xl: {
          control: "h-7",
          track: "h-3",
          thumb: "w-6 h-6",
          label: "text-base",
          valueText: "text-base",
          marker: "text-sm",
        },
      },
      orientation: {
        horizontal: {
          root: "w-full flex-col",
          control: "w-full flex-row items-center",
          track: "w-full",
          range: "h-full top-0",
          thumb: "top-1/2",
          marker: "top-1/2",
          markerTick: "-translate-y-1/2",
          markerLabel: "mt-2",
        },
        vertical: {
          root: "h-48 flex-row items-center",
          control: "h-full flex-col justify-end",
          track: "h-full w-2",
          range: "w-full bottom-0",
          thumb: "left-1/2",
          marker: "left-1/2 flex-row",
          markerTick: "-translate-x-1/2",
          markerLabel: "ml-2.5 mt-0",
        },
      },
      disabled: {
        true: {
          root: "opacity-60 cursor-not-allowed pointer-events-none",
          control: "cursor-not-allowed",
        },
        false: {},
      },
      invalid: {
        true: {
          range: `bg-${errorColor}`,
          thumb: `ring-2 ring-${errorColor}`,
        },
        false: {},
      },
      dragging: {
        true: {
          range: "transition-none",
          thumb: "transition-none scale-110 shadow-lg",
        },
        false: {},
      },
      hasMarkers: {
        true: {
          root: "pb-5",
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        orientation: "vertical",
        hasMarkers: true,
        class: {
          root: "pr-6 pb-0",
        },
      },
      ...colors.map((color) => ({
        color,
        invalid: false as const,
        class: {
          range: `bg-${color}`,
          thumb: `focus-visible:ring-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        invalid: false as const,
        class: {
          range: "bg-inverted",
          thumb: "focus-visible:ring-inverted",
        },
      },
      {
        invalid: true,
        class: {
          range: `bg-${errorColor}`,
          thumb: `focus-visible:ring-${errorColor}`,
        },
      },
    ],
    defaultVariants: {
      color: "primary",
      size: "md",
      orientation: "horizontal",
      disabled: false,
      invalid: false,
      dragging: false,
      hasMarkers: false,
    },
  });
}

