import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function badgeTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "flex items-center justify-center rounded-full font-medium leading-none whitespace-nowrap",
      text: "text-xs",
      leading: "shrink-0",
      trailing: "shrink-0",
    },
    variants: {
      color: createColorVariants(colors),
      size: {
        xs: {
          root: "px-1 py-0.5 gap-1.5 rounded-sm",
          text: "text-[8px]/3",
        },
        sm: {
          root: "text-[10px]/3 px-1.5 py-1 gap-1.5 rounded-sm",
          text: "text-[10px]/3",
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
      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        variant: "solid" as const,
        class: {
          root: `bg-${color}`,
        },
      })),
      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        variant: "outline" as const,
        class: {
          root: `border-${color} text-${color}`,
        },
      })),
      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        variant: "soft" as const,
        class: {
          root: `bg-${color}/20 text-${color}`,
        },
      })),
    ],
    defaultVariants: {
      color: "primary",
      size: "md",
      variant: "solid",
    },
  });
}
