import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function toastTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "transition-all duration-300 pointer-events-auto box-border data-[state=dismissing]:opacity-0 data-[state=dismissing]:scale-95",
      wrapper: "min-w-0 flex flex-col",
      title: "text-sm font-semibold",
      description: "text-xs",
      icon: "shrink-0",
      actions: "flex items-center gap-2",
      action: "",
      closeTrigger: "shrink-0 cursor-pointer transition-colors",
      progress:
        "absolute left-0 right-0 h-0.5 overflow-hidden pointer-events-none z-10",
    },
    variants: {
      mode: {
        default: {
          root: "w-full max-w-sm rounded-xl p-4 shadow-lg flex items-start gap-3 border relative overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white",
          wrapper: "flex-1 min-w-0 flex flex-col gap-0.5",
          title:
            "text-sm font-semibold text-neutral-900 dark:text-white leading-tight",
          description:
            "text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-normal",
          icon: "w-5 h-5 mt-0.5 shrink-0",
          actions: "mt-2.5 flex items-center gap-2",
          closeTrigger:
            "p-1 -m-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors shrink-0",
          progress: "h-0.5",
        },
        native: {
          root: "flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-900/70 dark:bg-neutral-700/80 backdrop-blur-[2px] border border-white/5 shadow-md text-center min-w-[120px] max-w-[200px] min-h-[100px] text-white",
          wrapper: "flex flex-col items-center justify-center text-center",
          title: "text-sm font-medium text-center text-white leading-snug",
          description: "text-xs text-white/85 text-center mt-1",
          icon: "w-9 h-9 mb-1.5 text-white shrink-0",
          actions: "hidden",
          action: "hidden",
          closeTrigger: "hidden",
          progress: "hidden",
        },
      },
      color: createColorVariants(colors),
      variant: {
        outline: {},
        solid: {
          root: "text-white border-transparent",
          title: "text-white",
          description: "text-white/85",
          closeTrigger: "text-white/70 hover:text-white",
          icon: "text-white",
        },
        soft: {
          root: "border-transparent",
        },
        subtle: {
          root: "border",
        },
      },
      orientation: {
        horizontal: {},
        vertical: {},
      },
      placement: {
        top: {
          root: "fixed top-0 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-sm mt-[calc(var(--cui-toast-top-offset,env(safe-area-inset-top,0px))+32rpx)] z-[100]",
        },
        center: {
          root: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-w-sm z-[100]",
        },
        bottom: {
          root: "fixed bottom-0 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] max-w-sm mb-[calc(var(--cui-toast-bottom-offset,env(safe-area-inset-bottom,0px))+32rpx)] z-[100]",
        },
      },
      progressPosition: {
        top: {
          progress: "top-0",
        },
        bottom: {
          progress: "bottom-0",
        },
      },
    },
    compoundVariants: [
      {
        mode: "native",
        orientation: "horizontal",
        class: {
          root: "flex-row items-center justify-center px-4 py-2.5 rounded-full min-w-0 max-w-xs min-h-0 gap-2",
          wrapper: "flex-row items-center gap-1.5",
          title: "text-xs font-medium text-white",
          description: "text-xs text-white/85 mt-0",
          icon: "w-5 h-5 mb-0 shrink-0",
        },
      },
      {
        mode: "native",
        placement: "top",
        class: {
          root: "fixed top-0 left-1/2 -translate-x-1/2 w-auto mt-[calc(var(--cui-toast-top-offset,env(safe-area-inset-top,0px))+32rpx)] z-[100]",
        },
      },
      {
        mode: "native",
        placement: "center",
        class: {
          root: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto z-[100]",
        },
      },
      {
        mode: "native",
        placement: "bottom",
        class: {
          root: "fixed bottom-0 left-1/2 -translate-x-1/2 w-auto mb-[calc(var(--cui-toast-bottom-offset,env(safe-area-inset-bottom,0px))+32rpx)] z-[100]",
        },
      },

      // 1. Outline (Web Default Style):
      // Clean elevated white card with neutral border and semantic colored icon
      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        variant: "outline" as const,
        mode: "default" as const,
        class: {
          root: "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-lg",
          title: "text-neutral-900 dark:text-white",
          description: "text-neutral-500 dark:text-neutral-400",
          closeTrigger:
            "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300",
          icon:
            color === "neutral"
              ? "text-neutral-900 dark:text-white"
              : `text-${color}`,
        },
      })),
      {
        color: "error" as any,
        variant: "outline" as const,
        mode: "default" as const,
        class: {
          root: "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-lg",
          title: "text-neutral-900 dark:text-white",
          description: "text-neutral-500 dark:text-neutral-400",
          closeTrigger:
            "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300",
          icon: "text-danger",
        },
      },

      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        variant: "solid" as const,
        mode: "default" as const,
        class: {
          root:
            color === "neutral"
              ? "bg-neutral-900 text-white border-neutral-800 dark:bg-neutral-800 dark:border-neutral-700"
              : `bg-${color} border-transparent text-white`,
          title: "text-white",
          description: "text-white/85",
          icon: "text-white",
          closeTrigger: "text-white/70 hover:text-white",
        },
      })),
      {
        color: "error" as any,
        variant: "solid" as const,
        mode: "default" as const,
        class: {
          root: "bg-danger border-transparent text-white",
          title: "text-white",
          description: "text-white/85",
          icon: "text-white",
          closeTrigger: "text-white/70 hover:text-white",
        },
      },

      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        variant: "soft" as const,
        mode: "default" as const,
        class: {
          root:
            color === "neutral"
              ? "bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-900 dark:text-white"
              : `bg-${color}/10 border-transparent text-${color}`,
          title:
            color === "neutral"
              ? "text-neutral-900 dark:text-white"
              : `text-${color}`,
          description:
            color === "neutral"
              ? "text-neutral-600 dark:text-neutral-300"
              : `text-${color}/80`,
          icon:
            color === "neutral"
              ? "text-neutral-700 dark:text-neutral-300"
              : `text-${color}`,
          closeTrigger:
            color === "neutral"
              ? "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
              : `text-${color}/70 hover:text-${color}`,
        },
      })),
      {
        color: "error" as any,
        variant: "soft" as const,
        mode: "default" as const,
        class: {
          root: "bg-danger/10 border-transparent text-danger",
          title: "text-danger",
          description: "text-danger/80",
          icon: "text-danger",
          closeTrigger: "text-danger/70 hover:text-danger",
        },
      },

      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        variant: "subtle" as const,
        mode: "default" as const,
        class: {
          root:
            color === "neutral"
              ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
              : `bg-${color}/10 border-${color}/20 text-${color}`,
          title:
            color === "neutral"
              ? "text-neutral-900 dark:text-white"
              : `text-${color}`,
          description:
            color === "neutral"
              ? "text-neutral-600 dark:text-neutral-300"
              : `text-${color}/80`,
          icon:
            color === "neutral"
              ? "text-neutral-700 dark:text-neutral-300"
              : `text-${color}`,
          closeTrigger:
            color === "neutral"
              ? "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white"
              : `text-${color}/70 hover:text-${color}`,
        },
      })),
      {
        color: "error" as any,
        variant: "subtle" as const,
        mode: "default" as const,
        class: {
          root: "bg-danger/10 border-danger/20 text-danger",
          title: "text-danger",
          description: "text-danger/80",
          icon: "text-danger",
          closeTrigger: "text-danger/70 hover:text-danger",
        },
      },
    ],
    defaultVariants: {
      mode: "default",
      color: "neutral",
      variant: "outline",
      orientation: "vertical",
      placement: "top",
      progressPosition: "bottom",
    },
  });
}
