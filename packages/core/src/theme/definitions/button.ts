import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  createColorCompoundVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function buttonTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "inline-flex rounded-md items-center justify-center font-medium select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 transition-colors appearance-none",
      label: "truncate",
      icon: "shrink-0",
      spinner: "shrink-0",
      leadingIcon: "shrink-0",
      trailingIcon: "shrink-0",
    },
    variants: {
      color: createColorVariants(colors),
      variant: {
        solid: {
          root: "",
        },
        outline: {
          root: "border bg-transparent",
        },
        ghost: {
          root: "bg-transparent",
        },
        soft: {
          root: "",
        },
        secondary: {
          root: "bg-neutral-100 text-neutral-900 active:bg-neutral-200",
        },
      },
      size: {
        xs: {
          root: "px-2 py-1 text-xs gap-1",
          icon: "w-3.5 h-3.5",
          spinner: "w-3.5 h-3.5",
          leadingIcon: "w-3.5 h-3.5",
          trailingIcon: "w-3.5 h-3.5",
        },
        sm: {
          root: "px-2.5 py-1.5 text-xs gap-1.5",
          icon: "w-4 h-4",
          spinner: "w-4 h-4",
          leadingIcon: "w-4 h-4",
          trailingIcon: "w-4 h-4",
        },
        md: {
          root: "px-2.5 py-1.5 text-sm gap-1.5",
          icon: "w-4 h-4",
          spinner: "w-4 h-4",
          leadingIcon: "w-4 h-4",
          trailingIcon: "w-4 h-4",
        },
        lg: {
          root: "px-3 py-2 text-sm gap-2",
          icon: "w-5 h-5",
          spinner: "w-5 h-5",
          leadingIcon: "w-5 h-5",
          trailingIcon: "w-5 h-5",
        },
        xl: {
          root: "px-3 py-2 text-base gap-2",
          icon: "w-5 h-5",
          spinner: "w-5 h-5",
          leadingIcon: "w-5 h-5",
          trailingIcon: "w-5 h-5",
        },
      },
      block: {
        true: {
          root: "w-full flex",
        },
      },
      disabled: {
        true: {
          root: "cursor-not-allowed opacity-60 pointer-events-none",
        },
      },
      loading: {
        true: {
          root: "",
        },
      },
    },
    compoundVariants: [
      ...createColorCompoundVariants(colors, {
        solid: (color) => ({
          root: `bg-${color} text-white border active:bg-${color}/90`,
        }),
        outline: (color) => ({
          root: `border border-${color} text-${color} active:bg-${color}/10`,
        }),
        ghost: (color) => ({
          root: `text-${color} active:bg-${color}/10`,
        }),
        soft: (color) => ({
          root: `bg-${color}/10 text-${color} border-transparent active:bg-${color}/20`,
        }),
      }),
    ],
    defaultVariants: {
      variant: "solid",
      color: "primary",
      size: "md",
    },
  });
}
