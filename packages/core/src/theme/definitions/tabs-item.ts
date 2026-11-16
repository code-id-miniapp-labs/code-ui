import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function tabsItemTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "w-full focus:outline-none",
      content: "w-full",
      trigger:
        "relative flex flex-row items-center justify-center font-medium transition-colors duration-200 select-none shrink-0 whitespace-nowrap z-[1] cursor-pointer focus:outline-none data-[disabled=true]:opacity-40 data-[disabled=true]:pointer-events-none",
      triggerInner:
        "relative z-10 flex flex-row items-center justify-center gap-1.5 min-w-0",
      leading: "relative z-10 shrink-0",
      label: "relative z-10 truncate",
      trailing: "relative z-10 shrink-0",
      indicator:
        "absolute pointer-events-none transition-all duration-200 ease-out origin-center",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(colors.map((color) => [color, {}])),
        { neutral: {} },
      ),
      variant: {
        pill: {
          indicator: "inset-0 rounded-lg bg-default shadow-xs z-0",
          trigger: "rounded-lg",
        },
        link: {
          indicator: "rounded-full z-10",
          trigger: "rounded-none",
        },
      },
      orientation: {
        horizontal: {
          trigger: "justify-center",
        },
        vertical: {
          trigger: "justify-start w-full",
        },
      },
      selected: {
        true: {
          trigger: "font-semibold",
          indicator: "opacity-100 scale-100",
        },
        false: {
          trigger: "text-muted hover:text-default",
          indicator: "opacity-0 scale-95",
        },
      },
      size: {
        xs: {
          trigger: "px-2 py-1 text-xs gap-1",
          leading: "size-3.5",
          trailing: "size-3.5",
          label: "text-xs",
        },
        sm: {
          trigger: "px-2.5 py-1 text-xs gap-1.5",
          leading: "size-4",
          trailing: "size-4",
          label: "text-xs",
        },
        md: {
          trigger: "px-3 py-1.5 text-sm gap-1.5",
          leading: "size-4",
          trailing: "size-4",
          label: "text-sm",
        },
        lg: {
          trigger: "px-3.5 py-2 text-sm gap-2",
          leading: "size-5",
          trailing: "size-5",
          label: "text-sm",
        },
        xl: {
          trigger: "px-4 py-2.5 text-base gap-2",
          leading: "size-5",
          trailing: "size-5",
          label: "text-base",
        },
      },
      disabled: {
        true: {
          root: "opacity-50 pointer-events-none",
          trigger: "opacity-40 pointer-events-none",
        },
        false: {},
      },
      fitted: {
        true: {
          trigger: "w-full flex-1 min-w-0",
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        variant: "pill",
        orientation: "horizontal",
        class: {
          trigger: "flex-1 shrink-0",
        },
      },
      {
        variant: "pill",
        orientation: "vertical",
        class: {
          trigger: "w-full justify-start",
        },
      },
      {
        variant: "link",
        orientation: "horizontal",
        class: {
          trigger: "pb-2.5 pt-1.5 px-1",
          indicator: "inset-x-0 bottom-0 h-0.5",
        },
      },
      {
        variant: "link",
        orientation: "horizontal",
        selected: false,
        class: {
          indicator: "opacity-0 scale-x-0",
        },
      },
      {
        variant: "link",
        orientation: "horizontal",
        selected: true,
        class: {
          indicator: "opacity-100 scale-x-100",
        },
      },
      {
        variant: "link",
        orientation: "vertical",
        class: {
          trigger: "py-2 pl-2.5 pr-4 w-full justify-start",
          indicator: "right-0 inset-y-1.5 w-0.5",
        },
      },
      {
        variant: "link",
        orientation: "vertical",
        selected: false,
        class: {
          indicator: "opacity-0 scale-y-0",
        },
      },
      {
        variant: "link",
        orientation: "vertical",
        selected: true,
        class: {
          indicator: "opacity-100 scale-y-100",
        },
      },
      ...colors.map((color) => ({
        selected: true as const,
        color,
        class: {
          trigger: `text-${color}`,
        },
      })),
      {
        selected: true as const,
        color: "neutral" as const,
        class: {
          trigger: "text-highlighted",
        },
      },
      ...colors.map((color) => ({
        variant: "link" as const,
        color,
        class: {
          indicator: `bg-${color}`,
        },
      })),
      {
        variant: "link" as const,
        color: "neutral" as const,
        class: {
          indicator: "bg-inverted",
        },
      },
    ],
    defaultVariants: {
      color: "primary",
      variant: "pill",
      orientation: "horizontal",
      size: "md",
      disabled: false,
      selected: false,
      fitted: false,
    },
  });
}
