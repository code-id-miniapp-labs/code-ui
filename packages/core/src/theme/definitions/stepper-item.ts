import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function stepperItemTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "group relative flex min-w-0",
      container: "relative flex shrink-0",
      trigger:
        "rounded-full text-center align-middle flex items-center justify-center font-semibold group-data-[state=completed]:text-white group-data-[state=current]:text-white group-data-[state=active]:text-white text-dimmed bg-elevated transition-colors cursor-pointer select-none focus:outline-none",
      indicator: "flex items-center justify-center size-full",
      icon: "shrink-0 leading-none",
      separator:
        "absolute rounded-full group-data-[disabled]:opacity-75 bg-accented transition-colors pointer-events-none",
      wrapper: "flex flex-col min-w-0 cursor-pointer select-none",
      title:
        "block font-medium text-muted group-data-[state=completed]:text-highlighted transition-colors truncate max-w-full w-full",
      description:
        "block text-dimmed transition-colors truncate max-w-full w-full mt-0.5",
    },
    variants: {
      orientation: {
        horizontal: {
          root: "flex-col items-center flex-1 min-w-16 shrink-0",
          container: "justify-center w-full",
          separator: "top-1/2 -translate-y-1/2 h-0.5",
          wrapper: "items-center text-center w-full px-0.5",
          title: "text-center",
          description: "text-center",
        },
        vertical: {
          root: "flex-row items-start gap-3 w-full text-start pb-6 last:pb-0",
          container: "flex-col items-center self-stretch",
          trigger: "shrink-0",
          separator: "start-1/2 -translate-x-1/2 bottom-1 w-0.5 min-h-4",
          wrapper: "items-start text-left flex-1 mt-0",
          title: "text-left whitespace-normal",
          description: "text-left whitespace-normal",
        },
      },
      size: {
        xs: {
          trigger: "size-5 text-2xs",
          icon: "size-2.5",
          title: "text-2xs",
          description: "text-3xs",
        },
        sm: {
          trigger: "size-6 text-xs",
          icon: "size-3",
          title: "text-xs",
          description: "text-2xs",
        },
        md: {
          trigger: "size-7 text-xs",
          icon: "size-3.5",
          title: "text-xs font-semibold",
          description: "text-2xs",
        },
        lg: {
          trigger: "size-8 text-sm",
          icon: "size-4",
          title: "text-sm font-semibold",
          description: "text-xs",
        },
        xl: {
          trigger: "size-10 text-base",
          icon: "size-5",
          title: "text-base font-semibold",
          description: "text-sm",
        },
      },
      color: Object.assign(
        Object.fromEntries(
          colors.map((color) => [
            color,
            {
              trigger: `group-data-[state=completed]:bg-${color} group-data-[state=current]:bg-${color} group-data-[state=active]:bg-${color}`,
              title: `group-data-[state=current]:text-${color} group-data-[state=active]:text-${color}`,
              separator: `group-data-[state=completed]:bg-${color}`,
            },
          ]),
        ),
        {
          neutral: {
            trigger:
              "group-data-[state=completed]:bg-inverted group-data-[state=completed]:text-inverted group-data-[state=current]:bg-inverted group-data-[state=current]:text-inverted group-data-[state=active]:bg-inverted group-data-[state=active]:text-inverted",
            title:
              "group-data-[state=current]:text-highlighted group-data-[state=active]:text-highlighted",
            separator: "group-data-[state=completed]:bg-inverted",
          },
        },
      ),
      disabled: {
        true: {
          root: "opacity-50 pointer-events-none cursor-not-allowed",
          trigger: "cursor-not-allowed",
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        orientation: "horizontal",
        size: "xs",
        class: {
          separator:
            "start-[calc(50%_+_var(--spacing)_*_3.5)] end-[calc(-50%_+_var(--spacing)_*_3.5)]",
          wrapper: "mt-1",
        },
      },
      {
        orientation: "horizontal",
        size: "sm",
        class: {
          separator:
            "start-[calc(50%_+_var(--spacing)_*_4)] end-[calc(-50%_+_var(--spacing)_*_4)]",
          wrapper: "mt-1.5",
        },
      },
      {
        orientation: "horizontal",
        size: "md",
        class: {
          separator:
            "start-[calc(50%_+_var(--spacing)_*_5)] end-[calc(-50%_+_var(--spacing)_*_5)]",
          wrapper: "mt-2",
        },
      },
      {
        orientation: "horizontal",
        size: "lg",
        class: {
          separator:
            "start-[calc(50%_+_var(--spacing)_*_5.5)] end-[calc(-50%_+_var(--spacing)_*_5.5)]",
          wrapper: "mt-2.5",
        },
      },
      {
        orientation: "horizontal",
        size: "xl",
        class: {
          separator:
            "start-[calc(50%_+_var(--spacing)_*_7)] end-[calc(-50%_+_var(--spacing)_*_7)]",
          wrapper: "mt-3",
        },
      },
      {
        orientation: "vertical",
        size: "xs",
        class: { separator: "top-6" },
      },
      {
        orientation: "vertical",
        size: "sm",
        class: { separator: "top-7" },
      },
      {
        orientation: "vertical",
        size: "md",
        class: { separator: "top-8" },
      },
      {
        orientation: "vertical",
        size: "lg",
        class: { separator: "top-[calc(var(--spacing)_*_9.25)]" },
      },
      {
        orientation: "vertical",
        size: "xl",
        class: { separator: "top-[calc(var(--spacing)_*_11.5)]" },
      },
    ],
    defaultVariants: {
      orientation: "horizontal",
      color: "primary",
      size: "md",
      disabled: false,
    },
  });
}
