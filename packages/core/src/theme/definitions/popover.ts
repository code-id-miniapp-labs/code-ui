import { defineTheme, type ThemeOptions } from "../../theme";

export default function popoverTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "relative",
      trigger: "relative",
      backdrop: "fixed inset-0 z-40 bg-transparent",
      positioner: "z-popover box-border",
      content:
        "relative w-full rounded-md bg-default text-default shadow-lg ring-1 ring-default box-border transition-[transform,opacity] duration-150 ease-out",
      body: "relative w-full overflow-hidden rounded-[inherit] bg-inherit",
      arrow:
        "absolute w-2.5 h-2.5 bg-default border-default pointer-events-none",
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
      block: {
        true: {
          root: "w-full",
          trigger: "w-full",
        },
        false: {
          root: "self-start w-fit max-w-full",
          trigger: "w-fit max-w-full",
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
      visible: {
        true: {
          root: "z-50",
          trigger: "z-50",
        },
        false: {},
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
      portal: false,
      block: false,
      open: false,
      visible: false,
      side: "bottom",
    },
  });
}
