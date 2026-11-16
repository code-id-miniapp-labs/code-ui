import { defineTheme, type ThemeOptions } from "../../theme";

export default function modalTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "fixed inset-0 z-50 box-border overscroll-contain",
      trigger: "inline-flex",
      overlay: "fixed inset-0 bg-black/35 backdrop-blur-md",
      container:
        "relative z-10 w-full flex items-center justify-center box-border",
      content:
        "pointer-events-auto relative flex flex-col w-full bg-default border border-muted shadow-2xl overflow-hidden box-border",
      header:
        "relative flex flex-col shrink-0 box-border w-full px-5 pt-4 pb-3.5",
      wrapper: "flex flex-col gap-1 min-w-0 w-full",
      title:
        "text-base font-semibold tracking-tight text-highlighted leading-snug",
      description: "text-xs text-muted leading-relaxed",
      closeTrigger:
        "absolute top-3.5 right-3.5 z-20 inline-flex items-center justify-center w-7 h-7 rounded-full bg-elevated text-muted shrink-0 cursor-pointer active:opacity-70 transition-opacity",
      closeButton: "p-0 w-full h-full rounded-full text-inherit",
      closeIcon: "w-3.5 h-3.5",
      body: "w-full box-border px-5 py-4 text-sm text-default leading-relaxed",
      footer:
        "flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-muted shrink-0 box-border w-full",
    },
    variants: {
      size: {
        xs: {
          content: "max-w-xs",
        },
        sm: {
          content: "max-w-sm",
        },
        md: {
          content: "max-w-md",
        },
        lg: {
          content: "max-w-lg",
        },
        xl: {
          content: "max-w-xl",
        },
      },
      fullscreen: {
        true: {
          container: "p-0",
          content:
            "w-full h-full max-w-none max-h-none rounded-none border-0 shadow-none",
          header: "pt-[calc(var(--spacing)_*_4_+_env(safe-area-inset-top))]",
          closeTrigger:
            "top-[calc(var(--spacing)_*_4_+_env(safe-area-inset-top))] right-4",
          footer:
            "pb-[calc(var(--spacing)_*_3.5_+_env(safe-area-inset-bottom))]",
        },
        false: {
          container: "p-5",
          content: "rounded-xl",
        },
      },
      scrollable: {
        true: {
          root: "overflow-y-auto",
          container: "min-h-full pointer-events-auto",
          body: "flex-none",
        },
        false: {
          root: "overflow-hidden",
          container: "h-full pointer-events-none",
          body: "flex-1 min-h-0 overflow-y-auto overscroll-contain",
        },
      },
      closable: {
        true: {},
        false: {},
      },
      hasBody: {
        true: {},
        false: {},
      },
      hasFooter: {
        true: {},
        false: {},
      },
      transition: {
        true: {
          overlay: "transition-opacity duration-300 ease-out",
          content: "transition-all duration-300 ease-out",
        },
        false: {
          overlay: "transition-none",
          content: "transition-none",
        },
      },
      open: {
        true: {
          overlay: "opacity-100 pointer-events-auto",
        },
        false: {
          overlay: "opacity-0 pointer-events-none",
        },
      },
    },
    compoundVariants: [
      {
        fullscreen: false,
        scrollable: false,
        class: {
          content: "max-h-[85vh]",
        },
      },
      {
        fullscreen: false,
        scrollable: true,
        class: {
          content: "max-h-none my-auto",
        },
      },
      {
        fullscreen: true,
        hasFooter: false,
        class: {
          body: "pb-[calc(var(--spacing)_*_4_+_env(safe-area-inset-bottom))]",
        },
      },
      {
        closable: true,
        class: {
          header: "pr-12",
        },
      },
      {
        hasBody: true,
        class: {
          header: "border-b border-muted",
        },
      },
      {
        open: true,
        transition: true,
        fullscreen: false,
        class: {
          overlay: "cui-modal-overlay-enter",
          content:
            "cui-modal-content-enter opacity-100 scale-100 translate-y-0",
        },
      },
      {
        open: true,
        transition: true,
        fullscreen: true,
        class: {
          overlay: "cui-modal-overlay-enter",
          content: "cui-modal-fullscreen-enter opacity-100 translate-y-0",
        },
      },
      {
        open: true,
        transition: false,
        class: {
          content: "opacity-100 scale-100 translate-y-0",
        },
      },
      {
        open: false,
        fullscreen: false,
        class: {
          content: "opacity-0 scale-95 translate-y-2",
        },
      },
      {
        open: false,
        fullscreen: true,
        class: {
          content: "opacity-0 translate-y-8",
        },
      },
    ],
    defaultVariants: {
      size: "md",
      fullscreen: false,
      scrollable: false,
      closable: true,
      hasBody: true,
      hasFooter: false,
      transition: true,
      open: false,
    },
  });
}
