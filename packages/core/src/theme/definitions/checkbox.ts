import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function checkboxTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative inline-flex flex-row items-start select-none cursor-pointer",
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
          root: "p-3 rounded-xl border border-neutral-200 bg-white shadow-xs transition-all w-full",
        },
      },
      color: createColorVariants(colors),
      size: {
        xs: {
          base: "w-3.5 h-3.5 rounded-xs",
          indicator: "w-2.5 h-2.5",
          icon: "text-xs",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-[20rpx]",
        },
        sm: {
          base: "w-4 h-4 rounded-xs",
          indicator: "w-3 h-3",
          icon: "text-xs",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-[22rpx]",
        },
        md: {
          base: "w-4.5 h-4.5 rounded",
          indicator: "w-3.5 h-3.5",
          icon: "text-sm",
          wrapper: "text-sm",
          label: "text-sm",
          description: "text-xs",
        },
        lg: {
          base: "w-5 h-5 rounded",
          indicator: "w-4 h-4",
          icon: "text-base",
          wrapper: "text-base",
          label: "text-base",
          description: "text-sm",
        },
        xl: {
          base: "w-6 h-6 rounded-md",
          indicator: "w-4.5 h-4.5",
          icon: "text-lg",
          wrapper: "text-lg",
          label: "text-lg",
          description: "text-base",
        },
      },
      checked: {
        true: {},
        false: {},
      },
      indeterminate: {
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
      required: {
        true: {
          label: `after:content-['*'] after:ms-0.5 after:text-${errorColor}`,
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        checked: false,
        indeterminate: false,
        class: {
          base: "border-neutral-300 bg-white",
          indicator: "opacity-0",
        },
      },
      ...(colors as readonly string[]).flatMap((color) => [
        {
          color: color as (typeof colors)[number],
          checked: true,
          class: {
            base: `border-${color} bg-${color} text-white`,
            indicator: "opacity-100",
          },
        },
        {
          color: color as (typeof colors)[number],
          indeterminate: true,
          class: {
            base: `border-${color} bg-${color} text-white`,
            indicator: "opacity-100",
          },
        },
        {
          variant: "card" as const,
          color: color as (typeof colors)[number],
          checked: true,
          class: {
            root: `border-${color} bg-${color}/5 ring-1 ring-${color}`,
            base: `border-${color} bg-${color} text-white`,
            indicator: "opacity-100",
          },
        },
        {
          variant: "card" as const,
          color: color as (typeof colors)[number],
          indeterminate: true,
          class: {
            root: `border-${color} bg-${color}/5 ring-1 ring-${color}`,
            base: `border-${color} bg-${color} text-white`,
            indicator: "opacity-100",
          },
        },
      ]),
      {
        invalid: true,
        checked: true,
        class: {
          base: `border-${errorColor} bg-${errorColor} text-white`,
          indicator: "opacity-100",
        },
      },
      {
        invalid: true,
        indeterminate: true,
        class: {
          base: `border-${errorColor} bg-${errorColor} text-white`,
          indicator: "opacity-100",
        },
      },
      {
        variant: "card" as const,
        invalid: true,
        class: {
          root: `border-${errorColor} ring-1 ring-${errorColor}`,
          base: `border-${errorColor}`,
        },
      },
    ],
    defaultVariants: {
      variant: "outline",
      color: "primary",
      size: "md",
      checked: false,
      indeterminate: false,
      disabled: false,
      invalid: false,
      required: false,
    },
  });
}
