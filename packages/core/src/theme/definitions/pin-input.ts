import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function pinInputTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "inline-flex flex-col gap-1.5",
      label: "text-sm font-medium text-neutral-900",
      control: "relative inline-flex items-center gap-1.5",
      input:
        "rounded-lg border text-center font-semibold transition-colors focus:outline-none",
      separator: "text-neutral-400 font-medium select-none px-0.5",
    },
    variants: {
      color: createColorVariants(colors),
      variant: {
        outline: {
          input: "bg-white text-neutral-900 border-neutral-300",
        },
        soft: {
          input: "bg-neutral-100/70 text-neutral-900 border-transparent",
        },
        subtle: {
          input: "bg-neutral-100 text-neutral-900 border-neutral-300",
        },
        ghost: {
          input: "bg-transparent text-neutral-900 border-transparent",
        },
        none: {
          input: "bg-transparent text-neutral-900 border-0",
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
          input: "cursor-not-allowed bg-neutral-100 text-neutral-400",
        },
        false: {
          input: "",
        },
      },
    },
    compoundVariants: (colors as readonly string[]).flatMap((color) => [
      {
        color: color as (typeof colors)[number],
        variant: ["outline", "subtle", "soft"] as any,
        class: {
          input: `focus:border-${color} focus:ring-2 focus:ring-${color}/20 data-[focused=true]:border-${color} data-[focused=true]:ring-2 data-[focused=true]:ring-${color}/20`,
        },
      },
      {
        color: color as (typeof colors)[number],
        highlight: true as const,
        class: {
          input: `border-${color} ring-2 ring-${color}/20`,
        },
      },
    ]),
    defaultVariants: {
      variant: "outline",
      color: "primary",
      size: "md",
      highlight: false,
      disabled: false,
    },
  });
}
