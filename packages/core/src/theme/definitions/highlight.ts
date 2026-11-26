import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function highlightTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "inline font-sans text-default leading-relaxed",
      text: "block",
      mark: "inline font-medium px-1 py-0.5 transition-colors",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(colors.map((color) => [color, {}])),
        { neutral: {} },
      ),
      variant: {
        soft: {
          mark: "",
        },
        solid: {
          mark: "text-white",
        },
        subtle: {
          mark: "ring-1 ring-inset",
        },
        outline: {
          mark: "bg-transparent border",
        },
        text: {
          mark: "bg-transparent px-0 py-0 font-semibold",
        },
      },
      size: {
        xs: {
          root: "text-xs",
        },
        sm: {
          root: "text-sm",
        },
        md: {
          root: "text-base",
        },
        lg: {
          root: "text-lg",
        },
        xl: {
          root: "text-xl",
        },
      },
      rounded: {
        true: {
          mark: "rounded-sm",
        },
        false: {
          mark: "rounded-none",
        },
      },
    },
    compoundVariants: [
      ...colors.map((color) => ({
        color,
        variant: "soft" as const,
        class: {
          mark: `bg-${color}/15 text-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "soft" as const,
        class: {
          mark: "bg-accented text-highlighted",
        },
      },
      ...colors.map((color) => ({
        color,
        variant: "solid" as const,
        class: {
          mark: `bg-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "solid" as const,
        class: {
          mark: "bg-inverted text-inverted",
        },
      },
      ...colors.map((color) => ({
        color,
        variant: "subtle" as const,
        class: {
          mark: `bg-${color}/10 text-${color} ring-${color}/25`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "subtle" as const,
        class: {
          mark: "bg-elevated text-highlighted ring-accented",
        },
      },
      ...colors.map((color) => ({
        color,
        variant: "outline" as const,
        class: {
          mark: `border-${color} text-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "outline" as const,
        class: {
          mark: "border-accented text-highlighted",
        },
      },
      ...colors.map((color) => ({
        color,
        variant: "text" as const,
        class: {
          mark: `text-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "text" as const,
        class: {
          mark: "text-highlighted",
        },
      },
    ],
    defaultVariants: {
      color: "primary",
      variant: "soft",
      rounded: true,
    },
  });
}
