import { defineTheme, type ThemeOptions } from "../../theme";

export default function cardTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "rounded-xl overflow-hidden flex flex-col",
      header: "flex flex-col gap-1 border-b border-neutral-200",
      title: "text-base font-semibold text-neutral-900",
      description: "text-sm text-neutral-500",
      body: "flex-1 text-sm text-neutral-700",
      footer: "flex items-center gap-2 border-t border-neutral-200",
    },
    variants: {
      variant: {
        outline: {
          root: "bg-white border border-neutral-200 shadow-xs",
        },
        solid: {
          root: "bg-neutral-900 text-white border border-neutral-800",
          header: "border-neutral-800",
          title: "text-white",
          description: "text-neutral-400",
          body: "text-neutral-200",
          footer: "border-neutral-800",
        },
        soft: {
          root: "bg-neutral-50/80 border border-transparent",
        },
        subtle: {
          root: "bg-neutral-50/80 border border-neutral-200",
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
