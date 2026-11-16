import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function qrCodeTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "relative inline-flex items-center justify-center rounded-md bg-white border border-neutral-200 shadow-sm",
      frame: "w-full h-full block",
      pattern: "fill-current",
      overlay:
        "absolute inset-0 m-auto flex items-center justify-center rounded-lg bg-white p-1 shadow-sm",
      overlayImage: "w-full h-full rounded-sm",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(
          colors.map((color) => [
            color,
            {
              root: `text-${color}`,
            },
          ]),
        ),
        {
          neutral: {
            root: "text-neutral-900",
          },
        },
      ),
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
