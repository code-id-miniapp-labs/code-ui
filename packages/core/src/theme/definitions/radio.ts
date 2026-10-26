import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function radioTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative inline-flex items-start select-none cursor-pointer",
      base: "relative mt-0.5 flex items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      indicator: "rounded-full transition-transform duration-150 ease-out",
      wrapper: "ms-2 flex flex-col justify-center",
      label: "block font-medium text-neutral-900 leading-snug",
      description: "text-neutral-500 mt-0.5 leading-snug",
    },
    variants: {
      variant: {
        outline: {},
        card: {
          root: "p-3 rounded-xl border border-neutral-200 bg-white shadow-xs transition-all w-full",
        },
      },
      color: Object.fromEntries(
        (colors as readonly string[]).map((color) => [
          color,
          {
            base: `border-${color} text-${color}`,
            indicator: `bg-${color}`,
          },
        ]),
      ),
      size: {
        xs: {
          base: "w-3.5 h-3.5",
          indicator: "w-1.5 h-1.5",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-[20rpx]",
        },
        sm: {
          base: "w-4 h-4",
          indicator: "w-2 h-2",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-[22rpx]",
        },
        md: {
          base: "w-4.5 h-4.5",
          indicator: "w-2.5 h-2.5",
          wrapper: "text-sm",
          label: "text-sm",
          description: "text-xs",
        },
        lg: {
          base: "w-5 h-5",
          indicator: "w-3 h-3",
          wrapper: "text-base",
          label: "text-base",
          description: "text-sm",
        },
        xl: {
          base: "w-6 h-6",
          indicator: "w-3.5 h-3.5",
          wrapper: "text-lg",
          label: "text-lg",
          description: "text-base",
        },
      },
      checked: {
        true: {},
        false: {},
      },
      disabled: {
        true: {
          root: "opacity-50 cursor-not-allowed",
          base: "cursor-not-allowed",
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
        checked: false,
        invalid: false,
        class: {
          base: "border-neutral-300 text-transparent",
        },
      },
      ...(colors as readonly string[]).map((color) => ({
        variant: "card" as const,
        color: color as (typeof colors)[number],
        checked: true,
        class: {
          root: `border-${color} bg-${color}/5 ring-1 ring-${color}`,
        },
      })),
      {
        variant: "card" as const,
        invalid: true,
        class: {
          root: `border-${errorColor} ring-1 ring-${errorColor}`,
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
          root: `border-${errorColor} ring-1 ring-${errorColor}`,
          base: `border-${errorColor} text-${errorColor}`,
          indicator: `bg-${errorColor}`,
        },
      },
    ],
    defaultVariants: {
      variant: "outline",
      color: "primary",
      size: "md",
      checked: false,
      disabled: false,
      invalid: false,
    },
  });
}
