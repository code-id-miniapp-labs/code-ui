import { defineTheme, type ThemeOptions } from "../../theme";

export default function tabsItemTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "w-full focus:outline-none",
      content: "w-full",
    },
    variants: {
      disabled: {
        true: {
          root: "opacity-50 pointer-events-none",
        },
        false: {},
      },
    },
    defaultVariants: {
      disabled: false,
    },
  });
}
