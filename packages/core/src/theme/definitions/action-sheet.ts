import { defineTheme, type ThemeOptions } from "../../theme";

export default function actionSheetTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "fixed inset-0 z-action-sheet flex items-end justify-center overflow-hidden overscroll-contain box-border",
      backdrop:
        "cui-action-sheet-backdrop-enter fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
      content:
        "cui-action-sheet-content-enter relative z-10 flex flex-col w-full max-h-[85vh] bg-elevated rounded-t-lg shadow-2xl transition-transform duration-300 ease-out box-border overflow-hidden translate-y-0",
      header:
        "relative flex flex-col items-center justify-center px-6 py-4 bg-default text-center border-b border-muted shrink-0 w-full box-border",
      title:
        "w-full max-w-full break-words text-xs font-semibold uppercase tracking-wider text-dimmed text-center leading-snug",
      description:
        "w-full max-w-full break-words text-xs text-muted text-center mt-1 leading-normal",
      closeTrigger:
        "absolute right-3.5 top-3.5 z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-elevated text-muted shrink-0 cursor-pointer active:opacity-70 transition-opacity",
      closeButton: "p-0 w-full h-full rounded-full text-inherit",
      closeIcon: "w-4 h-4",
      body: "flex flex-col w-full bg-default overflow-y-auto max-h-[60vh] overscroll-contain box-border",
      item: "relative flex items-center justify-center w-full min-h-14 md:min-h-12 px-6 py-3.5 bg-default border-t border-muted first:border-t-0 text-base cursor-pointer select-none box-border outline-none active:bg-muted transition-colors",
      itemHover: "opacity-70",
      itemText:
        "flex flex-col items-center justify-center text-center flex-1 w-full min-w-0 pointer-events-none",
      itemTitle: "flex items-center justify-center gap-2 w-full",
      itemLabel:
        "text-base font-normal text-highlighted text-center leading-snug",
      itemLabelDestructive: "text-danger font-medium",
      itemDescription: "text-xs text-dimmed text-center mt-1 leading-snug",
      itemIcon: "w-5 h-5 shrink-0 text-muted pointer-events-none",
      itemIconDestructive: "text-danger",
      itemLoadingIcon: "animate-spin text-primary",
      gap: "w-full h-2 bg-elevated shrink-0",
      actions:
        "flex items-center justify-center gap-2 w-full p-3 bg-default pb-[calc(var(--spacing)_*_3_+_env(safe-area-inset-bottom))] box-border",
      action: "flex-1",
    },
    variants: {
      open: {
        true: {
          backdrop: "opacity-100 pointer-events-auto",
        },
        false: {
          backdrop: "opacity-0 pointer-events-none",
        },
      },
      disabled: {
        true: {
          item: "cursor-not-allowed pointer-events-none",
          itemTitle: "opacity-50",
          itemDescription: "opacity-75",
        },
        false: {},
      },
      closable: {
        true: {
          header: "px-14 min-h-14",
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        open: false,
        class: {
          content: "translate-y-full",
        },
      },
      {
        open: true,
        class: {
          content: "translate-y-0",
        },
      },
    ],
    defaultVariants: {
      open: false,
      disabled: false,
      closable: false,
    },
  });
}
