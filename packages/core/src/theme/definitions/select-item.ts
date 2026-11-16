import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function selectItemTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "relative w-full box-border",
      base: "relative flex items-center w-full select-none cursor-pointer rounded-md transition-colors box-border active:bg-elevated",
      leading: "shrink-0 flex items-center justify-center text-dimmed",
      leadingIcon: "shrink-0",
      wrapper: "flex-1 min-w-0 flex flex-col",
      label: "truncate text-highlighted",
      description: "truncate text-muted",
      trailing: "ms-auto shrink-0 flex items-center justify-center",
      trailingIcon: "shrink-0",
      groupLabel: "font-semibold text-highlighted select-none truncate",
      separator: "h-px bg-muted my-1 -mx-1",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(colors.map((color) => [color, {}])),
        { neutral: {} },
      ),
      size: {
        xs: {
          base: "px-1.5 py-1 text-xs gap-1.5",
          leadingIcon: "size-3.5",
          trailingIcon: "size-3.5",
          description: "text-2xs",
          groupLabel: "px-1.5 py-1 text-2xs",
        },
        sm: {
          base: "px-2 py-1.5 text-xs gap-1.5",
          leadingIcon: "size-4",
          trailingIcon: "size-4",
          description: "text-2xs",
          groupLabel: "px-2 py-1 text-xs",
        },
        md: {
          base: "px-2.5 py-1.5 text-sm gap-2",
          leadingIcon: "size-4",
          trailingIcon: "size-4",
          description: "text-xs",
          groupLabel: "px-2.5 py-1.5 text-xs",
        },
        lg: {
          base: "px-3 py-2 text-base gap-2",
          leadingIcon: "size-5",
          trailingIcon: "size-5",
          description: "text-sm",
          groupLabel: "px-3 py-1.5 text-sm",
        },
        xl: {
          base: "px-3.5 py-2.5 text-lg gap-2.5",
          leadingIcon: "size-5",
          trailingIcon: "size-5",
          description: "text-sm",
          groupLabel: "px-3.5 py-2 text-sm",
        },
      },
      selected: {
        true: {
          base: "bg-elevated/70",
          label: "font-medium",
        },
        false: {},
      },
      disabled: {
        true: {
          base: "opacity-50 cursor-not-allowed pointer-events-none",
        },
        false: {},
      },
    },
    compoundVariants: [
      ...colors.map((color) => ({
        color,
        selected: true as const,
        class: {
          trailingIcon: `text-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        selected: true as const,
        class: {
          trailingIcon: "text-highlighted",
        },
      },
    ],
    defaultVariants: {
      color: "primary",
      size: "md",
      selected: false,
      disabled: false,
    },
  });
}
