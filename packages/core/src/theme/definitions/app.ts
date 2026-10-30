import { defineTheme, type ThemeOptions } from "../../theme";

export default function appTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "relative flex flex-col min-h-screen box-border transition-colors duration-300",
      scaleWrapper:
        "w-full flex-1 flex flex-col box-border transform-origin-top transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
    },
    variants: {
      locked: {
        true: {},
        false: {},
      },
      scaled: {
        true: {
          root: "bg-black",
          scaleWrapper: "overflow-hidden rounded-2xl shadow-2xl",
        },
        false: {
          scaleWrapper: "rounded-none shadow-none",
        },
      },
    },
    defaultVariants: {
      locked: false,
      scaled: false,
    },
  });
}
