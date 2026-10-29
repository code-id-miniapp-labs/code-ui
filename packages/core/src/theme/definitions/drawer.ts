import { defineTheme, type ThemeOptions } from "../../theme";

export default function drawerTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "fixed inset-0 z-50 flex overflow-hidden overscroll-contain box-border",
      backdrop:
        "fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
      content:
        "relative z-10 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out box-border overflow-hidden",
      grabber:
        "w-full flex items-center justify-center py-2.5 cursor-grab active:cursor-grabbing shrink-0 box-border",
      grabberBar: "w-10 h-1.5 rounded-full bg-neutral-300",
      header:
        "flex items-center justify-between px-4 py-3 border-b border-neutral-100 shrink-0 box-border w-full",
      title: "text-base font-semibold text-neutral-900",
      description: "text-sm text-neutral-500",
      closeTrigger:
        "inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors shrink-0",
      body: "flex-1 min-h-0 w-full box-border overflow-y-auto px-4 pt-3 pb-6 text-sm text-neutral-600 overscroll-contain",
      footer:
        "flex items-center justify-end gap-2 px-4 py-3 border-t border-neutral-100 shrink-0 box-border w-full pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
    },
    variants: {
      placement: {
        bottom: {
          root: "items-end justify-center",
          content: "w-full max-h-[85vh] rounded-t-2xl translate-y-0",
        },
        top: {
          root: "items-start justify-center",
          content: "w-full max-h-[85vh] rounded-b-2xl translate-y-0",
        },
        left: {
          root: "items-center justify-start",
          content: "h-full w-4/5 max-w-sm rounded-r-2xl translate-x-0",
        },
        right: {
          root: "items-center justify-end",
          content: "h-full w-4/5 max-w-sm rounded-l-2xl translate-x-0",
        },
      },
      open: {
        true: {
          backdrop: "opacity-100 pointer-events-auto",
        },
        false: {
          backdrop: "opacity-0 pointer-events-none",
        },
      },
    },
    compoundVariants: [
      {
        placement: "bottom",
        open: false,
        class: {
          content: "translate-y-full",
        },
      },
      {
        placement: "top",
        open: false,
        class: {
          content: "-translate-y-full",
        },
      },
      {
        placement: "left",
        open: false,
        class: {
          content: "-translate-x-full",
        },
      },
      {
        placement: "right",
        open: false,
        class: {
          content: "translate-x-full",
        },
      },
    ],
    defaultVariants: {
      placement: "bottom",
      open: true,
    },
  });
}
