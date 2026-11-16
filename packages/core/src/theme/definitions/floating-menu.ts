import { defineTheme, type ThemeOptions } from "../../theme";

export default function floatingMenuTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "relative w-full",
      trigger: "w-full",
      backdrop: "fixed inset-0 z-40 bg-transparent",
      positioner: "z-50 box-border",
      content:
        "relative w-full overflow-hidden rounded-lg bg-default text-default shadow-lg ring-1 ring-default box-border transition-all duration-150 ease-out",
      arrow:
        "absolute w-2.5 h-2.5 rotate-45 bg-default border-default pointer-events-none",
    },
    variants: {
      portal: {
        true: {
          positioner: "fixed",
        },
        false: {
          positioner: "absolute",
        },
      },
      open: {
        true: {
          backdrop: "pointer-events-auto",
          content: "opacity-100 scale-100 pointer-events-auto",
        },
        false: {
          backdrop: "pointer-events-none",
          content: "opacity-0 scale-95 pointer-events-none",
        },
      },
      side: {
        bottom: {
          arrow: "border-t border-l",
        },
        top: {
          arrow: "border-b border-r",
        },
      },
    },
    defaultVariants: {
      portal: true,
      open: false,
      side: "bottom",
    },
  });
}
