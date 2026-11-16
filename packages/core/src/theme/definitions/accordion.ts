import { defineTheme, type ThemeOptions } from "../../theme";

export default function accordionTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "w-full flex flex-col",
    },
    variants: {
      variant: {
        outline: {
          root: "border border-default divide-y divide-default rounded-lg overflow-hidden",
        },
        subtle: {
          root: "bg-muted divide-y divide-default rounded-lg overflow-hidden",
        },
        soft: {
          root: "bg-elevated divide-y divide-default rounded-lg overflow-hidden",
        },
        plain: {
          root: "divide-y divide-default",
        },
        separated: {
          root: "gap-2",
        },
      },
      disabled: {
        true: {
          root: "opacity-50 pointer-events-none",
        },
        false: {},
      },
    },
    defaultVariants: {
      variant: "outline",
      disabled: false,
    },
  });
}

