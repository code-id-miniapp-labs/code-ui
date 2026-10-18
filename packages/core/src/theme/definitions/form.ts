import { defineTheme, type ThemeOptions } from "../../theme";

export default function formTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "flex flex-col gap-4 w-full",
      errors: "flex flex-col gap-1 mt-1",
      error: "text-xs text-danger font-medium",
    },
    variants: {
      disabled: {
        true: {
          root: "opacity-60 pointer-events-none",
        },
        false: {
          root: "",
        },
      },
    },
    compoundVariants: [],
    defaultVariants: {
      disabled: false,
    },
  });
}
