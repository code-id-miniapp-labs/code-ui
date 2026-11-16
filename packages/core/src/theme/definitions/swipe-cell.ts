import { defineTheme, type ThemeOptions } from "../../theme";

export default function swipeCellTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "relative overflow-hidden w-full select-none touch-pan-y box-border",
      wrapper:
        "relative flex flex-row w-full transition-transform duration-300 ease-out will-change-transform box-border",
      content: "relative z-10 w-full shrink-0 bg-default box-border",
      left: "absolute left-0 top-0 bottom-0 z-0 flex flex-row h-full -translate-x-full box-border",
      right:
        "absolute right-0 top-0 bottom-0 z-0 flex flex-row h-full translate-x-full box-border",
      action:
        "flex flex-row items-center justify-center h-full text-white transition-opacity active:opacity-85 select-none cursor-pointer box-border font-medium",
      actionText: "font-medium leading-none",
      actionIcon: "shrink-0",
    },
    variants: {
      variant: {
        plain: {
          root: "",
          content: "bg-default",
        },
        outline: {
          root: "border border-default rounded-md overflow-hidden shadow-xs",
          content: "bg-default",
        },
        subtle: {
          root: "border border-default rounded-md overflow-hidden bg-muted",
          content: "bg-muted",
        },
        soft: {
          root: "rounded-md overflow-hidden bg-elevated",
          content: "bg-elevated",
        },
        separated: {
          root: "rounded-md border border-default shadow-xs overflow-hidden",
          content: "bg-default",
        },
      },
      size: {
        xs: {
          action: "px-2.5 text-xs gap-1",
          actionText: "text-xs",
          actionIcon: "size-3.5",
        },
        sm: {
          action: "px-3 text-xs gap-1.5",
          actionText: "text-xs",
          actionIcon: "size-3.5",
        },
        md: {
          action: "px-4 text-sm gap-2",
          actionText: "text-sm",
          actionIcon: "size-4",
        },
        lg: {
          action: "px-5 text-base gap-2",
          actionText: "text-base",
          actionIcon: "size-5",
        },
        xl: {
          action: "px-6 text-lg gap-2.5",
          actionText: "text-lg",
          actionIcon: "size-6",
        },
      },
      disabled: {
        true: {
          root: "opacity-60 pointer-events-none",
        },
        false: {},
      },
    },
    compoundVariants: [],
    defaultVariants: {
      variant: "plain",
      size: "md",
      disabled: false,
    },
  });
}
