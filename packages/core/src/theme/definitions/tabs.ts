import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function tabsTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "w-full flex gap-2",
      list: "relative flex p-1 group gap-1",
      indicator: "absolute transition-[translate,width] duration-200 ease-out",
      trigger:
        "relative inline-flex items-center justify-center font-medium transition-colors select-none",
      leading: "shrink-0",
      label: "truncate",
      trailing: "shrink-0",
      content: "focus:outline-none w-full",
    },
    variants: {
      color: Object.fromEntries(
        (colors as readonly string[]).map((color) => [
          color,
          {
            trigger: `data-[state=active]:text-${color}`,
            indicator: `bg-${color}`,
          },
        ]),
      ),
      variant: {
        pill: {
          list: "bg-neutral-100 rounded-lg",
          indicator: "rounded-md shadow-xs",
          trigger:
            "rounded-md data-[state=inactive]:text-neutral-500 hover:data-[state=inactive]:text-neutral-900",
        },
        link: {
          list: "border-b border-neutral-200 gap-4",
          indicator: "-bottom-px h-0.5",
          trigger:
            "pb-2.5 -mb-px data-[state=inactive]:text-neutral-500 hover:data-[state=inactive]:text-neutral-900",
        },
      },
      orientation: {
        horizontal: {
          root: "flex-col",
          list: "flex-row items-center w-full",
        },
        vertical: {
          root: "flex-row",
          list: "flex-col items-stretch",
        },
      },
      size: {
        xs: {
          list: "text-xs",
          trigger: "px-2 py-1 text-xs gap-1",
          leading: "size-3.5",
          trailing: "size-3.5",
          label: "text-xs",
        },
        sm: {
          list: "text-xs",
          trigger: "px-2.5 py-1 text-xs gap-1.5",
          leading: "size-4",
          trailing: "size-4",
          label: "text-xs",
        },
        md: {
          list: "text-sm",
          trigger: "px-3 py-1.5 text-sm gap-2",
          leading: "size-4",
          trailing: "size-4",
          label: "text-sm",
        },
        lg: {
          list: "text-sm",
          trigger: "px-3.5 py-2 text-sm gap-2",
          leading: "size-5",
          trailing: "size-5",
          label: "text-sm",
        },
        xl: {
          list: "text-base",
          trigger: "px-4 py-2.5 text-base gap-2.5",
          leading: "size-5",
          trailing: "size-5",
          label: "text-base",
        },
      },
      disabled: {
        true: {
          root: "opacity-50 pointer-events-none",
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        variant: "pill",
        color: "neutral",
        class: {
          indicator: "bg-white text-neutral-900 shadow-xs",
          trigger: "data-[state=active]:text-neutral-900",
        },
      },
      {
        variant: "link",
        orientation: "vertical",
        class: {
          list: "border-b-0 border-r border-neutral-200",
          indicator: "-right-px -bottom-0 w-0.5 h-full",
          trigger: "pb-0 pr-2.5 -mr-px",
        },
      },
    ],
    defaultVariants: {
      color: "primary",
      variant: "pill",
      orientation: "horizontal",
      size: "md",
      disabled: false,
    },
  });
}

