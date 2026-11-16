import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function badgeTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "flex items-center justify-center rounded-full font-medium leading-none whitespace-nowrap",
      text: "text-xs",
      leading: "shrink-0",
      trailing: "shrink-0",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(colors.map((color) => [color, {}])),
        { neutral: {} },
      ),
      size: {
        xs: {
          root: "px-1 py-0.5 gap-1.5 rounded-sm",
          text: "text-3xs/3",
        },
        sm: {
          root: "text-2xs/3 px-1.5 py-1 gap-1.5 rounded-sm",
          text: "text-2xs/3",
        },
        md: {
          root: "px-2 py-1 gap-1.5 rounded-md",
          text: "text-xs ",
        },
        lg: {
          root: "text-sm px-2 py-1 gap-2 rounded-md",
          text: "text-sm ",
        },
        xl: {
          root: "px-2.5 py-1 gap-2 rounded-md",
          text: "text-base",
        },
      },
      variant: {
        solid: {
          root: "text-white",
        },
        outline: {
          root: "bg-transparent border",
        },
        soft: {
          root: "",
        },
      },
    },
    compoundVariants: [
      ...colors.map((color) => ({
        color,
        variant: "solid" as const,
        class: {
          root: `bg-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "solid" as const,
        class: {
          root: "bg-neutral",
        },
      },
      ...colors.map((color) => ({
        color,
        variant: "outline" as const,
        class: {
          root: `border-${color} text-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "outline" as const,
        class: {
          root: "border-neutral text-neutral",
        },
      },
      ...colors.map((color) => ({
        color,
        variant: "soft" as const,
        class: {
          root: `bg-${color}/20 text-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "soft" as const,
        class: {
          root: "bg-neutral/20 text-neutral",
        },
      },
    ],
    defaultVariants: {
      color: "primary",
      size: "md",
      variant: "solid",
    },
  });
}
