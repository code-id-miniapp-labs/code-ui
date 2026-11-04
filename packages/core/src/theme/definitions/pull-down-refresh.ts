import { defineTheme, type ThemeOptions } from "../../theme";

export default function pullDownRefreshTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "relative block w-full h-full overflow-hidden box-border",
      header: "relative z-10 w-full shrink-0",
      track: "relative flex w-full flex-col will-change-transform",
      tips: "flex w-full items-center justify-center overflow-hidden text-xs text-neutral-500",
      indicator: "mr-1 size-4 shrink-0 animate-spin text-primary",
      text: "text-xs text-neutral-500",
      content: "w-full",
    },
    variants: {
      disabled: {
        true: {
          root: "opacity-60",
        },
        false: {},
      },
      status: {
        idle: {},
        pulling: {},
        armed: {
          text: "font-medium text-primary",
        },
        refreshing: {
          text: "text-primary",
        },
        success: {
          text: "",
        },
      },
    },
    compoundVariants: [],
    defaultVariants: {
      disabled: false,
      status: "idle",
    },
  });
}
