import { defineTheme, type ThemeOptions } from "../../theme";

export default function swipeCellTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "relative overflow-hidden w-full select-none touch-pan-y box-border",
      wrapper:
        "relative flex w-full transition-transform duration-300 ease-out will-change-transform box-border",
      content: "relative z-10 w-full shrink-0 bg-white box-border",
      left: "absolute left-0 top-0 bottom-0 z-0 flex h-full -translate-x-full box-border",
      right: "absolute right-0 top-0 bottom-0 z-0 flex h-full translate-x-full box-border",
      action:
        "inline-flex items-center justify-center h-full px-4 text-sm font-medium text-white transition-opacity active:opacity-85 select-none cursor-pointer box-border",
      actionText: "text-sm font-medium leading-none",
      actionIcon: "size-4 shrink-0",
    },
    variants: {
      disabled: {
        true: {
          root: "opacity-60 pointer-events-none",
        },
      },
    },
    compoundVariants: [],
    defaultVariants: {
      disabled: false,
    },
  });
}
