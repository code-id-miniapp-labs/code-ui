import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function tabsItemTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "w-full focus:outline-none",
      content: "w-full",
      trigger:
        "relative inline-flex items-center justify-center font-medium transition-colors duration-200 select-none shrink-0 whitespace-nowrap z-[1] cursor-pointer focus:outline-none data-[disabled=true]:opacity-40 data-[disabled=true]:pointer-events-none",
      leading: "relative z-10 shrink-0",
      label: "relative z-10 truncate",
      trailing: "relative z-10 shrink-0",
      indicator:
        "absolute pointer-events-none transition-all duration-200 ease-out origin-center",
    },
    variants: {
      color: createColorVariants(colors),
      variant: {
        pill: {
          indicator: "inset-0 rounded-lg bg-white shadow-xs z-0",
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
          trigger: "text-neutral-500 hover:text-neutral-700",
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
          trigger: "flex-1 min-w-0",
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
      ...(colors as readonly string[]).map((color) => ({
        selected: true as const,
        color: color as (typeof colors)[number],
        class: {
          trigger: color === "neutral" ? "text-neutral-900" : `text-${color}`,
        },
      })),
      ...(colors as readonly string[]).map((color) => ({
        variant: "link" as const,
        color: color as (typeof colors)[number],
        class: {
          indicator: `bg-${color === "neutral" ? "neutral-900" : color}`,
        },
      })),
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
