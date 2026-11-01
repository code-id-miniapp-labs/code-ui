import { defineTheme, type ThemeOptions } from "../../theme";

export default function tabsTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "w-full flex gap-3",
      list: "relative flex group flex-nowrap whitespace-nowrap box-border",
      content: "focus:outline-none flex-1 min-w-0",
    },
    variants: {
      variant: {
        pill: {
          list: "bg-neutral-100 rounded-xl p-1 gap-1",
        },
        link: {
          list: "border-b border-neutral-200 gap-5 p-0",
        },
      },
      orientation: {
        horizontal: {
          root: "flex-col",
          list: "flex-row items-center min-w-full inline-flex",
          content: "w-full",
        },
        vertical: {
          root: "flex-row items-start gap-4",
          list: "flex-col items-stretch shrink-0",
        },
      },
      size: {
        xs: {},
        sm: {},
        md: {},
        lg: {},
        xl: {},
      },
      disabled: {
        true: {
          root: "opacity-50 pointer-events-none",
        },
        false: {},
      },
      fitted: {
        true: {
          list: "w-full min-w-full",
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        variant: "pill",
        size: "xs",
        class: {
          list: "p-1 gap-1 rounded-lg",
        },
      },
      {
        variant: "pill",
        size: "sm",
        class: {
          list: "p-1 gap-1 rounded-lg",
        },
      },
      {
        variant: "pill",
        size: "md",
        class: {
          list: "p-1 gap-1 rounded-xl",
        },
      },
      {
        variant: "pill",
        size: "lg",
        class: {
          list: "p-1.5 gap-1.5 rounded-xl",
        },
      },
      {
        variant: "pill",
        size: "xl",
        class: {
          list: "p-1.5 gap-1.5 rounded-xl",
        },
      },
      {
        variant: "link",
        orientation: "horizontal",
        class: {
          list: "border-b border-neutral-200 gap-5 p-0",
        },
      },
      {
        variant: "link",
        orientation: "vertical",
        class: {
          list: "border-b-0 border-r border-neutral-200 gap-1 p-0",
        },
      },
    ],
    defaultVariants: {
      variant: "pill",
      orientation: "horizontal",
      size: "md",
      disabled: false,
      fitted: false,
    },
  });
}
