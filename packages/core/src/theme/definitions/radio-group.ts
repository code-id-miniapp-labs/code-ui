import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function radioGroupTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative inline-flex flex-col gap-1.5",
      fieldset: "flex flex-col gap-2",
      legend: "block font-medium text-neutral-900 leading-snug",
    },
    variants: {
      variant: {
        outline: {},
        card: {},
      },
      color: createColorVariants(colors),
      size: {
        xs: { legend: "text-xs" },
        sm: { legend: "text-xs" },
        md: { legend: "text-sm" },
        lg: { legend: "text-base" },
        xl: { legend: "text-lg" },
      },
      orientation: {
        vertical: {
          fieldset: "flex flex-col gap-2",
        },
        horizontal: {
          fieldset: "flex flex-row flex-wrap gap-4",
        },
      },
      checked: {
        true: {},
        false: {},
      },
      disabled: {
        true: {},
        false: {},
      },
      required: {
        true: {
          legend: `after:content-['*'] after:ms-0.5 after:text-${errorColor}`,
        },
        false: {},
      },
      invalid: {
        true: {},
        false: {},
      },
    },
    defaultVariants: {
      variant: "outline",
      color: "primary",
      size: "md",
      orientation: "vertical",
      checked: false,
      disabled: false,
      required: false,
      invalid: false,
    },
  });
}
