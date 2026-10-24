import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function qrCodeTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "relative inline-flex items-center justify-center rounded-xl bg-white border border-neutral-200 shadow-sm",
      frame: "w-full h-full block",
      pattern: "fill-current",
      overlay:
        "absolute inset-0 m-auto flex items-center justify-center rounded-lg bg-white p-1 shadow-sm",
    },
    variants: {
      color: {
        ...Object.fromEntries(
          (colors as readonly string[]).map((color) => [
            color,
            {
              root: `text-${color}`,
              pattern: `fill-${color}`,
            },
          ]),
        ),
        neutral: {
          root: "text-neutral-900",
          pattern: "fill-neutral-900",
        },
        primary: {
          root: "text-primary",
          pattern: "fill-primary",
        },
        secondary: {
          root: "text-secondary",
          pattern: "fill-secondary",
        },
        success: {
          root: "text-success",
          pattern: "fill-success",
        },
        info: {
          root: "text-info",
          pattern: "fill-info",
        },
        warning: {
          root: "text-warning",
          pattern: "fill-warning",
        },
        danger: {
          root: "text-danger",
          pattern: "fill-danger",
        },
      },
      size: {
        xs: {
          root: "w-24 h-24 p-1.5",
          overlay: "w-6 h-6",
        },
        sm: {
          root: "w-32 h-32 p-2",
          overlay: "w-8 h-8",
        },
        md: {
          root: "w-40 h-40 p-2.5",
          overlay: "w-10 h-10",
        },
        lg: {
          root: "w-48 h-48 p-3",
          overlay: "w-12 h-12",
        },
        xl: {
          root: "w-56 h-56 p-3.5",
          overlay: "w-14 h-14",
        },
      },
    },
    defaultVariants: {
      color: "neutral",
      size: "md",
    },
  });
}
