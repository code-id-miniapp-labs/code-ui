import { defineTheme, type ThemeOptions } from "../../theme";

export default function appTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "relative flex flex-col min-h-screen box-border text-default transition-[padding,background-color] duration-300",
      scaleWrapper:
        "w-full flex-1 flex flex-col box-border bg-default text-default transform-origin-top transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
      toaster: "fixed z-[100] pointer-events-none",
    },
    variants: {
      scaled: {
        true: {
          root: "bg-black",
          scaleWrapper: "overflow-hidden rounded-2xl shadow-2xl",
        },
        false: {
          root: "bg-default",
          scaleWrapper: "rounded-none shadow-none",
        },
      },
    },
    defaultVariants: {
      scaled: false,
    },
  });
}
