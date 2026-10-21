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
      item: "relative inline-flex items-start select-none cursor-pointer",
      base: "relative flex items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      indicator: "rounded-full transition-transform duration-150 ease-out",
      wrapper: "ms-2 flex flex-col justify-center",
      label: "block font-medium text-neutral-900 leading-snug",
      description: "text-neutral-500 leading-snug",
      help: "text-xs text-neutral-500 leading-snug",
      error: `text-xs text-${errorColor} leading-snug`,
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
          base: "w-3.5 h-3.5",
          indicator: "w-1.5 h-1.5",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-[20rpx]",
          legend: "text-xs",
        },
        sm: {
          base: "w-4 h-4",
          indicator: "w-2 h-2",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-[22rpx]",
          legend: "text-xs",
        },
        md: {
          base: "w-4.5 h-4.5",
          indicator: "w-2.5 h-2.5",
          wrapper: "text-sm",
          label: "text-sm",
          description: "text-xs",
          legend: "text-sm",
        },
        lg: {
          base: "w-5 h-5",
          indicator: "w-3 h-3",
          wrapper: "text-base",
          label: "text-base",
          description: "text-sm",
          legend: "text-base",
        },
        xl: {
          base: "w-6 h-6",
          indicator: "w-3.5 h-3.5",
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
      checked: {
        true: {},
        false: {},
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
      ...(colors as readonly string[]).flatMap((color) => [
        {
          color: color as (typeof colors)[number],
          checked: true,
          class: {
            base: `border-${color} text-${color}`,
            indicator: `bg-${color}`,
          },
        },
        {
          variant: "card" as const,
          color: color as (typeof colors)[number],
          checked: true,
          class: {
            item: `border-${color} bg-${color}/5 ring-1 ring-${color}`,
            base: `border-${color} text-${color}`,
            indicator: `bg-${color}`,
          },
        },
      ]),
      {
        variant: "card" as const,
        invalid: true,
        class: {
          item: `border-${errorColor} ring-1 ring-${errorColor}`,
          base: `border-${errorColor}`,
        },
      },
      {
        invalid: true,
        checked: true,
        class: {
          base: `border-${errorColor} text-${errorColor}`,
          indicator: `bg-${errorColor}`,
        },
      },
      {
        variant: "card" as const,
        invalid: true,
        checked: true,
        class: {
          item: `border-${errorColor} ring-1 ring-${errorColor}`,
          base: `border-${errorColor} text-${errorColor}`,
          indicator: `bg-${errorColor}`,
        },
      },
    ],
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
