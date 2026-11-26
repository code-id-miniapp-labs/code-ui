import { defineTheme, type ThemeOptions } from "../../theme";

export default function drawerTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "fixed inset-0 z-drawer flex overflow-hidden overscroll-contain box-border",
      backdrop: "fixed inset-0 bg-black/40 transition-opacity duration-300",
      content:
        "relative z-10 flex bg-default shadow-2xl transition-transform duration-300 ease-out will-change-transform box-border overflow-hidden",
      container: "flex flex-col min-w-0 min-h-0 overflow-hidden",
      grabber:
        "flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 box-border",
      grabberBar: "rounded-full bg-accented",
      header:
        "flex items-center justify-between px-4 py-3 border-b border-muted shrink-0 box-border w-full",
      headerContent: "flex-1 min-w-0",
      closeTrigger:
        "inline-flex items-center justify-center w-8 h-8 rounded-full text-dimmed hover:text-default hover:bg-elevated transition-colors shrink-0",
      closeButton: "p-0 w-full h-full rounded-full text-inherit",
      closeIcon: "w-4 h-4",
      body: "min-h-0 w-full box-border overflow-y-auto px-4 pt-3 pb-6 text-sm text-toned overscroll-contain",
      footer:
        "flex items-center justify-end gap-2 px-4 py-3 border-t border-muted shrink-0 box-border w-full pb-[calc(var(--spacing)_*_3_+_env(safe-area-inset-bottom))]",
    },
    variants: {
      placement: {
        bottom: {
          root: "items-end justify-center",
          content: "flex-col w-full max-h-[85vh] rounded-t-xl",
          container: "w-full flex-initial",
          body: "flex-initial max-h-[60vh]",
          grabber: "w-full py-2.5",
          grabberBar: "w-12 h-1.5",
        },
        top: {
          root: "items-start justify-center",
          content: "flex-col w-full max-h-[85vh] rounded-b-xl",
          container: "w-full flex-initial",
          body: "flex-initial max-h-[60vh]",
          grabber: "w-full py-2.5",
          grabberBar: "w-12 h-1.5",
          header: "pt-[calc(var(--spacing)_*_3_+_env(safe-area-inset-top))]",
          footer: "pb-3",
        },
        left: {
          root: "items-center justify-start",
          content: "flex-row h-full w-4/5 max-w-sm md:max-w-md rounded-none",
          container: "flex-1 h-full",
          body: "flex-1 h-0",
          grabber: "h-full px-2.5",
          grabberBar: "w-1.5 h-12",
          header: "pt-[calc(var(--spacing)_*_3_+_env(safe-area-inset-top))]",
        },
        right: {
          root: "items-center justify-end",
          content: "flex-row h-full w-4/5 max-w-sm md:max-w-md rounded-none",
          container: "flex-1 h-full",
          body: "flex-1 h-0",
          grabber: "h-full px-2.5",
          grabberBar: "w-1.5 h-12",
          header: "pt-[calc(var(--spacing)_*_3_+_env(safe-area-inset-top))]",
        },
      },
      open: {
        true: {
          backdrop: "cui-drawer-backdrop-enter opacity-100 pointer-events-auto",
          content: "cui-drawer-open",
        },
        false: {
          backdrop: "opacity-0 pointer-events-none",
        },
      },
      keyboardOpen: {
        true: {
          footer: "pb-3",
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        placement: "bottom",
        keyboardOpen: true,
        class: {
          content: "max-h-[calc(100%_-_env(safe-area-inset-top))]",
          body: "max-h-[calc(100vh_-_var(--keyboard-height,0px)_-_env(safe-area-inset-top,0px)_-_10rem)]",
        },
      },
      {
        placement: "top",
        keyboardOpen: true,
        class: {
          content: "max-h-full",
          body: "max-h-[calc(100vh_-_var(--keyboard-height,0px)_-_env(safe-area-inset-top,0px)_-_10rem)]",
        },
      },
      {
        placement: "bottom",
        open: true,
        class: {
          content: "cui-drawer-enter-bottom",
        },
      },
      {
        placement: "top",
        open: true,
        class: {
          content: "cui-drawer-enter-top",
        },
      },
      {
        placement: "left",
        open: true,
        class: {
          content: "cui-drawer-enter-left",
        },
      },
      {
        placement: "right",
        open: true,
        class: {
          content: "cui-drawer-enter-right",
        },
      },
      {
        placement: "bottom",
        open: false,
        class: {
          content: "cui-drawer-closed-bottom",
        },
      },
      {
        placement: "top",
        open: false,
        class: {
          content: "cui-drawer-closed-top",
        },
      },
      {
        placement: "left",
        open: false,
        class: {
          content: "cui-drawer-closed-left",
        },
      },
      {
        placement: "right",
        open: false,
        class: {
          content: "cui-drawer-closed-right",
        },
      },
    ],
    defaultVariants: {
      placement: "bottom",
      open: true,
      keyboardOpen: false,
    },
  });
}
