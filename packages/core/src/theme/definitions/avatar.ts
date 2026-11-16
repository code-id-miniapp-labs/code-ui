import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function avatarTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "relative overflow-hidden inline-flex items-center justify-center shrink-0 select-none rounded-full align-middle",
      image: "absolute inset-0 h-full w-full rounded-full object-cover block",
      fallback: "font-medium truncate text-sm",
      icon: "shrink-0",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(
          colors.map((color) => [
            color,
            {
              root: `bg-${color}/10`,
              fallback: `text-${color}`,
              icon: `text-${color}`,
            },
          ]),
        ),
        {
          neutral: {
            root: "bg-elevated",
            fallback: "text-muted",
            icon: "text-muted",
          },
        },
      ),
      size: {
        "3xs": {
          root: "size-4",
          fallback: "text-[length:calc(var(--spacing)_*_2)]",
        },
        "2xs": {
          root: "size-5",
          fallback: "text-3xs",
        },
        xs: {
          root: "size-6",
          fallback: "text-xs",
        },
        sm: {
          root: "size-7",
          fallback: "text-xs",
        },
        md: {
          root: "size-8",
          fallback: "text-sm",
        },
        lg: {
          root: "size-9",
          fallback: "text-md",
        },
        xl: {
          root: "size-10",
          fallback: "text-lg",
        },
        "2xl": {
          root: "size-11",
          fallback: "text-xl",
        },
        "3xl": {
          root: "size-12",
          fallback: "text-2xl",
        },
      },
    },
    defaultVariants: {
      size: "md",
      color: "neutral",
    },
  });
}
