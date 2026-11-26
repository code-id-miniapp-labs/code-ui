import { defineTheme, type ThemeOptions } from "../../theme";

export default function appTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "relative flex flex-col min-h-screen box-border text-default transition-colors duration-300",
      scaleWrapper:
        "w-full flex-1 flex flex-col box-border bg-default text-default origin-top transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform",
      toaster: "fixed z-toast pointer-events-none",
    },
    variants: {
      scaled: {
        true: {
          root: "bg-black",
          scaleWrapper: "",
        },
        false: {
          root: "bg-default",
          scaleWrapper: "",
        },
      },
    },
    defaultVariants: {
      scaled: false,
    },
  });
}
