import { defineTheme, type ThemeOptions } from "../../theme";

export default function skeletonTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "bg-gray-200 rounded",
    },
    variants: {
      variant: {
        pulse: {
          root: "animate-pulse",
        },
        shine: {
          root: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shine_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        },
        none: {
          root: "",
        },
      },
    },
    defaultVariants: {
      variant: "pulse",
    },
  });
}
