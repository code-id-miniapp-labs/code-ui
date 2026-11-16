import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function pinInputTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "inline-flex flex-col gap-1.5",
      label: "text-sm font-medium text-highlighted",
      control: "relative inline-flex items-center gap-1.5",
      input:
        "flex items-center justify-center overflow-hidden min-h-0 box-border p-0 m-0 rounded-lg border text-center font-semibold transition-colors focus:outline-none",
      nativeInput:
        "w-full min-h-0 bg-transparent border-0 p-0 m-0 text-center font-semibold text-inherit leading-normal focus:outline-none",
      separator: "text-dimmed font-medium select-none px-0.5",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(
          colors.map((color) => [
            color,
            {
              input: `focus:border-${color} focus:ring-2 focus:ring-${color}/20 data-[focused=true]:border-${color} data-[focused=true]:ring-2 data-[focused=true]:ring-${color}/20`,
            },
          ]),
        ),
        {
          neutral: {
            input:
              "focus:border-inverted focus:ring-2 focus:ring-inverted/20 data-[focused=true]:border-inverted data-[focused=true]:ring-2 data-[focused=true]:ring-inverted/20",
          },
        },
      ),
      variant: {
        outline: {
          input: "bg-default text-highlighted border-accented",
        },
        soft: {
          input: "bg-elevated text-highlighted border-transparent",
        },
        subtle: {
          input: "bg-elevated text-highlighted border-accented",
        },
        ghost: {
          input: "bg-transparent text-highlighted border-transparent focus:border-transparent focus:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
        },
        none: {
          input: "bg-transparent text-highlighted border-0 focus:border-transparent focus:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
        },
      },
      size: {
        xs: {
          input: "w-7 h-7 text-xs",
          separator: "text-xs",
        },
        sm: {
          input: "w-8 h-8 text-xs",
          separator: "text-xs",
        },
        md: {
          input: "w-9 h-9 text-sm",
          separator: "text-sm",
        },
        lg: {
          input: "w-10 h-10 text-base",
          separator: "text-base",
        },
        xl: {
          input: "w-11 h-11 text-lg",
          separator: "text-lg",
        },
      },
      highlight: {
        true: {
          input: "",
        },
        false: {
          input: "",
        },
      },
      disabled: {
        true: {
          root: "opacity-60 cursor-not-allowed",
          input: "cursor-not-allowed bg-elevated text-dimmed",
        },
        false: {
          input: "",
        },
      },
      invalid: {
        true: {
          input: "",
        },
        false: {
          input: "",
        },
      },
    },
    compoundVariants: [
      ...colors.map((color) => ({
        color,
        highlight: true as const,
        class: {
          input: `border-${color} ring-2 ring-${color}/20`,
        },
      })),
      {
        color: "neutral" as const,
        highlight: true as const,
        class: {
          input: "border-inverted ring-2 ring-inverted/20",
        },
      },
      {
        invalid: true as const,
        class: {
          input: `border-${errorColor} ring-2 ring-${errorColor}/20 focus:border-${errorColor} focus:ring-2 focus:ring-${errorColor}/20 data-[focused=true]:border-${errorColor} data-[focused=true]:ring-2 data-[focused=true]:ring-${errorColor}/20`,
        },
      },
    ],
    defaultVariants: {
      variant: "outline",
      color: "primary",
      size: "md",
      highlight: false,
      disabled: false,
      invalid: false,
    },
  });
}
