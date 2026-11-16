import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function buttonTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "inline-flex font-sans rounded-md items-center justify-center font-medium select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 transition-colors appearance-none",
      label: "truncate",
      icon: "shrink-0",
      iconInner: "w-full h-full block",
      spinner: "shrink-0",
      spinnerIcon: "w-full h-full animate-spin",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(colors.map((color) => [color, {}])),
        { neutral: {} },
      ),
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
          root: "bg-elevated text-highlighted active:bg-accented",
        },
      },
      size: {
        xs: {
          root: "px-2 py-1 text-xs gap-1",
          icon: "w-3.5 h-3.5",
          spinner: "w-3.5 h-3.5",
        },
        sm: {
          root: "px-2.5 py-1.5 text-xs gap-1.5",
          icon: "w-4 h-4",
          spinner: "w-4 h-4",
        },
        md: {
          root: "px-2.5 py-1.5 text-sm gap-1.5",
          icon: "w-4 h-4",
          spinner: "w-4 h-4",
        },
        lg: {
          root: "px-3 py-2 text-sm gap-2",
          icon: "w-5 h-5",
          spinner: "w-5 h-5",
        },
        xl: {
          root: "px-3 py-2 text-base gap-2",
          icon: "w-5 h-5",
          spinner: "w-5 h-5",
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
      ...colors.map((color) => ({
        color,
        variant: "solid" as const,
        class: {
          root: `bg-${color} text-white border active:bg-${color}/90`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "solid" as const,
        class: {
          root: "bg-neutral text-white border active:bg-neutral/90",
        },
      },
      ...colors.map((color) => ({
        color,
        variant: "outline" as const,
        class: {
          root: `border border-${color} text-${color} active:bg-${color}/10`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "outline" as const,
        class: {
          root: "border border-neutral text-neutral active:bg-neutral/10",
        },
      },
      ...colors.map((color) => ({
        color,
        variant: "ghost" as const,
        class: {
          root: `text-${color} active:bg-${color}/10`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "ghost" as const,
        class: {
          root: "text-neutral active:bg-neutral/10",
        },
      },
      ...colors.map((color) => ({
        color,
        variant: "soft" as const,
        class: {
          root: `bg-${color}/10 text-${color} border-transparent active:bg-${color}/20`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "soft" as const,
        class: {
          root: "bg-neutral/10 text-neutral border-transparent active:bg-neutral/20",
        },
      },
    ],
    defaultVariants: {
      variant: "solid",
      color: "primary",
      size: "md",
    },
  });
}
