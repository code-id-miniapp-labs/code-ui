import { defineTheme, type ThemeOptions } from "../../theme";

export default function presenceTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "",
    },
    variants: {
      present: {
        true: {},
        false: {},
      },
    },
    defaultVariants: {
      present: false,
    },
  });
}
