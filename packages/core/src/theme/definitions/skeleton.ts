import { defineTheme, type ThemeOptions } from "../../theme";

export default function skeletonTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "bg-accented rounded-sm",
    },
    variants: {
      variant: {
        pulse: {
          root: "animate-pulse",
        },
        shine: {
          root: "cui-skeleton-shine",
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
