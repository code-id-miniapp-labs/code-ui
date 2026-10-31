import { defineTheme, type ThemeOptions } from "../../theme";

export default function accordionTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "w-full flex flex-col",
    },
    variants: {
      variant: {
        outline: {
          root: "border border-neutral-200 divide-y divide-neutral-200 rounded-lg overflow-hidden",
        },
        subtle: {
          root: "bg-neutral-50/80 divide-y divide-neutral-200/60 rounded-lg overflow-hidden",
        },
        soft: {
          root: "bg-neutral-100/50 divide-y divide-neutral-200/50 rounded-lg overflow-hidden",
        },
        plain: {
          root: "divide-y divide-neutral-200",
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

