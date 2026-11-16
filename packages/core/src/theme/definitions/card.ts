import { defineTheme, type ThemeOptions } from "../../theme";

export default function cardTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "rounded-xl overflow-hidden flex flex-col",
      header: "flex flex-col gap-1 border-b border-default",
      title: "text-base font-semibold text-highlighted",
      description: "text-sm text-muted",
      body: "flex-1 text-sm text-default",
      footer: "flex items-center gap-2 border-t border-default",
    },
    variants: {
      variant: {
        outline: {
          root: "bg-default border border-default shadow-xs",
        },
        solid: {
          root: "bg-inverted text-inverted border border-inverted",
          header: "border-accented",
          title: "text-inverted",
          description: "text-dimmed",
          body: "text-inverted",
          footer: "border-accented",
        },
        soft: {
          root: "bg-muted border border-transparent",
        },
        subtle: {
          root: "bg-muted border border-default",
        },
      },
      size: {
        sm: {
          header: "p-3",
          body: "p-3",
          footer: "p-3",
        },
        md: {
          header: "p-4",
          body: "p-4",
          footer: "p-4",
        },
        lg: {
          header: "p-6",
          body: "p-6",
          footer: "p-6",
        },
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "md",
    },
  });
}
