import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function checkboxGroupTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative inline-flex flex-col gap-1.5",
      fieldset: "flex flex-col gap-2",
      legend: "block font-medium text-neutral-900 leading-snug select-none",
      item: "relative inline-flex flex-row items-start select-none cursor-pointer",
      base: "relative flex items-center justify-center border transition-colors shrink-0",
      indicator:
        "flex items-center justify-center w-full h-full text-white transition-opacity duration-150 ease-out select-none pointer-events-none",
      icon: "w-full h-full select-none pointer-events-none",
      wrapper: "ms-2 flex flex-col justify-center select-none min-w-0",
      label: "block font-medium text-neutral-900 leading-snug select-none",
      description: "text-neutral-500 leading-snug select-none",
    },
    variants: {
      variant: {
        outline: {},
        card: {
          item: "p-3 rounded-xl border border-neutral-200 bg-white shadow-xs transition-all",
        },
      },
      color: createColorVariants(colors),
      size: {
        xs: {
          base: "w-3.5 h-3.5 rounded-xs",
          indicator: "w-2.5 h-2.5",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-[20rpx]",
          legend: "text-xs",
        },
        sm: {
          base: "w-4 h-4 rounded-xs",
          indicator: "w-3 h-3",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-[22rpx]",
          legend: "text-xs",
        },
        md: {
          base: "w-4.5 h-4.5 rounded",
          indicator: "w-3.5 h-3.5",
          wrapper: "text-sm",
          label: "text-sm",
          description: "text-xs",
          legend: "text-sm",
        },
        lg: {
          base: "w-5 h-5 rounded",
          indicator: "w-4 h-4",
          wrapper: "text-base",
          label: "text-base",
          description: "text-sm",
          legend: "text-base",
        },
        xl: {
          base: "w-6 h-6 rounded-md",
          indicator: "w-4.5 h-4.5",
          wrapper: "text-lg",
          label: "text-lg",
          description: "text-base",
          legend: "text-lg",
        },
      },
      orientation: {
        vertical: {
          fieldset: "flex flex-col gap-2",
        },
        horizontal: {
          fieldset: "flex flex-row flex-wrap gap-4",
        },
      },
      disabled: {
        true: {
          item: "opacity-50 cursor-not-allowed",
          base: "cursor-not-allowed",
        },
        false: {},
      },
      required: {
        true: {
          legend: `after:content-['*'] after:ms-0.5 after:text-${errorColor}`,
        },
        false: {},
      },
      invalid: {
        true: {
          base: `border-${errorColor} ring-1 ring-${errorColor}`,
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        variant: "card" as const,
        invalid: true,
        class: {
          item: `border-${errorColor} ring-1 ring-${errorColor}`,
          base: `border-${errorColor}`,
        },
      },
    ],
    defaultVariants: {
      variant: "outline",
      color: "primary",
      size: "md",
      orientation: "vertical",
      disabled: false,
      required: false,
      invalid: false,
    },
  });
}
