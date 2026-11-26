import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function checkboxTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative inline-flex flex-row items-start select-none cursor-pointer",
      base: "relative mt-0.5 flex items-center justify-center border transition-colors shrink-0",
      indicator:
        "flex items-center justify-center w-full h-full text-white transition-opacity duration-150 ease-out select-none pointer-events-none",
      icon: "w-full h-full select-none pointer-events-none",
      wrapper: "ms-2 flex flex-col justify-center select-none min-w-0",
      label: "block font-medium text-highlighted leading-snug select-none",
      description: "block mt-0.5 text-muted leading-snug select-none",
    },
    variants: {
      variant: {
        outline: {},
        card: {
          root: "p-3 rounded-xl border border-default bg-default shadow-xs transition-colors w-full",
        },
      },
      color: Object.assign(
        Object.fromEntries(
          colors.map((color) => [
            color,
            {
              base: `border-${color} bg-${color} text-white`,
            },
          ]),
        ),
        {
          neutral: {
            base: "border-inverted bg-inverted text-inverted",
          },
        },
      ),
      size: {
        xs: {
          base: "w-3.5 h-3.5 rounded-xs",
          indicator: "w-2.5 h-2.5",
          icon: "text-xs",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-2xs",
        },
        sm: {
          base: "w-4 h-4 rounded-xs",
          indicator: "w-3 h-3",
          icon: "text-xs",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-2xs",
        },
        md: {
          base: "w-4.5 h-4.5 rounded-sm",
          indicator: "w-3.5 h-3.5",
          icon: "text-sm",
          wrapper: "text-sm",
          label: "text-sm",
          description: "text-xs",
        },
        lg: {
          base: "w-5 h-5 rounded-sm",
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
        true: {
          indicator: "opacity-100",
        },
        false: {},
      },
      indeterminate: {
        true: {
          indicator: "opacity-100",
        },
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
        invalid: false,
        class: {
          base: "border-accented bg-default",
          indicator: "opacity-0",
        },
      },
      {
        checked: false,
        indeterminate: false,
        invalid: true,
        class: {
          base: `border-${errorColor} bg-default`,
          indicator: "opacity-0",
        },
      },
      ...colors.flatMap((color) => [
        {
          variant: "card" as const,
          color,
          checked: true as const,
          class: {
            root: `border-${color} bg-${color}/5 ring-1 ring-${color}`,
          },
        },
        {
          variant: "card" as const,
          color,
          indeterminate: true as const,
          class: {
            root: `border-${color} bg-${color}/5 ring-1 ring-${color}`,
          },
        },
      ]),
      {
        variant: "card" as const,
        color: "neutral" as const,
        checked: true as const,
        class: {
          root: "border-inverted bg-elevated ring-1 ring-inverted",
        },
      },
      {
        variant: "card" as const,
        color: "neutral" as const,
        indeterminate: true as const,
        class: {
          root: "border-inverted bg-elevated ring-1 ring-inverted",
        },
      },
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
