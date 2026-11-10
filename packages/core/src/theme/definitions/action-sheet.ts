import { defineTheme, type ThemeOptions } from "../../theme";

export default function actionSheetTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "fixed inset-0 z-50 flex items-end justify-center overflow-hidden overscroll-contain box-border",
      backdrop:
        "fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
      content:
        "relative z-10 flex flex-col w-full max-h-[85vh] bg-neutral-100 dark:bg-neutral-900 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out box-border overflow-hidden translate-y-0",
      header:
        "relative flex flex-col items-center justify-center px-4 py-3 bg-white dark:bg-neutral-800 text-center border-b border-neutral-100 dark:border-neutral-700/60 shrink-0 w-full box-border",
      title:
        "text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-center",
      description:
        "text-xs text-neutral-500 dark:text-neutral-400 text-center mt-1 leading-normal",
      closeTrigger:
        "absolute right-3.5 top-3.5 inline-flex items-center justify-center w-7 h-7 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 active:bg-neutral-100 dark:active:bg-neutral-700/50 transition-colors shrink-0 cursor-pointer",
      body: "flex flex-col w-full bg-white dark:bg-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-700/60 overflow-y-auto max-h-[60vh] overscroll-contain box-border",
      item: "relative flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-white dark:bg-neutral-800 text-center text-base transition-colors active:bg-neutral-100 dark:active:bg-neutral-700/60 cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none box-border border-0 m-0 leading-normal after:border-none outline-none",
      itemLabel: "text-base font-normal text-neutral-900 dark:text-neutral-100",
      itemDescription: "text-xs text-neutral-400 dark:text-neutral-500 mt-0.5",
      itemIcon: "w-5 h-5 shrink-0",
      gap: "w-full h-2 bg-neutral-100 dark:bg-neutral-900 shrink-0",
      cancel:
        "relative flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-white dark:bg-neutral-800 text-center text-base font-semibold text-neutral-900 dark:text-neutral-100 active:bg-neutral-100 dark:active:bg-neutral-700/60 cursor-pointer select-none box-border border-0 m-0 leading-normal after:border-none outline-none pb-[calc(0.875rem+env(safe-area-inset-bottom))]",
      cancelText: "text-base font-semibold text-neutral-900 dark:text-neutral-100",
      cancelIcon: "w-5 h-5 shrink-0",
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
