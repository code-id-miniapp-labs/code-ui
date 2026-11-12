import { defineTheme, type ThemeOptions } from "../../theme";

export default function actionSheetTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "fixed inset-0 z-50 flex items-end justify-center overflow-hidden overscroll-contain box-border",
      backdrop:
        "cui-action-sheet-backdrop-enter fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
      content:
        "cui-action-sheet-content-enter relative z-10 flex flex-col w-full max-h-[85vh] bg-neutral-100 dark:bg-neutral-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out box-border overflow-hidden translate-y-0",
      header:
        "relative flex flex-col items-center justify-center px-6 py-4 bg-white dark:bg-neutral-800 text-center border-b border-neutral-100 dark:border-neutral-700/60 shrink-0 w-full box-border",
      title:
        "text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 text-center leading-snug",
      description:
        "text-xs text-neutral-500 dark:text-neutral-400 text-center mt-1 leading-normal",
      closeTrigger:
        "absolute right-3.5 top-3.5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-700/60 text-neutral-500 dark:text-neutral-300 shrink-0 cursor-pointer active:opacity-70 transition-opacity",
      body: "flex flex-col w-full bg-white dark:bg-neutral-800 overflow-y-auto max-h-[60vh] overscroll-contain box-border",
      item: "relative flex items-center justify-center w-full min-h-14 px-6 py-3.5 bg-white dark:bg-neutral-800 border-t border-neutral-100 dark:border-neutral-700/60 first:border-t-0 text-base cursor-pointer select-none box-border outline-none disabled:opacity-40 active:bg-neutral-50 dark:active:bg-neutral-700/50 transition-colors",
      itemText:
        "flex flex-col items-center justify-center text-center flex-1 w-full min-w-0 pointer-events-none",
      itemTitle: "flex items-center justify-center gap-2 w-full",
      itemLabel:
        "text-base font-normal text-neutral-900 dark:text-neutral-100 text-center leading-snug",
      itemDescription:
        "text-xs text-neutral-400 dark:text-neutral-500 text-center mt-1 leading-snug",
      itemIcon:
        "w-5 h-5 shrink-0 text-neutral-500 dark:text-neutral-400 pointer-events-none",
      gap: "w-full h-2 bg-neutral-100 dark:bg-neutral-900 shrink-0",
      actions:
        "flex items-center justify-center gap-2 w-full p-3 bg-white dark:bg-neutral-800 pb-[calc(0.75rem+env(safe-area-inset-bottom))] box-border",
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
    },
  });
}
