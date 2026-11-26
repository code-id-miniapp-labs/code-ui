import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function toastTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "transition-[transform,opacity] duration-300 will-change-transform pointer-events-auto box-border data-[state=dismissing]:opacity-0 data-[state=dismissing]:scale-95",
      tint: "absolute inset-0 pointer-events-none z-0",
      wrapper: "min-w-0 flex flex-col relative z-1",
      title: "text-sm font-semibold",
      description: "text-xs",
      iconWrapper: "relative z-1 flex shrink-0",
      icon: "shrink-0",
      actions: "flex items-center gap-2",
      action: "",
      closeTrigger: "shrink-0 cursor-pointer transition-colors relative z-1",
      closeButton: "p-0.5 rounded-md text-inherit",
      closeIcon: "w-4 h-4",
      progress:
        "absolute left-0 right-0 h-0.5 overflow-hidden pointer-events-none z-10",
      progressBar: "w-full h-full min-w-0 overflow-hidden",
      progressTrack: "bg-transparent h-full min-w-0 rounded-none",
      progressRange: "rounded-none h-full min-w-0 transition-none",
    },
    variants: {
      mode: {
        default: {
          root: "w-full max-w-sm md:max-w-md rounded-xl p-4 shadow-lg flex items-start gap-3 border relative overflow-hidden bg-default border-default text-highlighted",
          wrapper: "flex-1 min-w-0 flex flex-col gap-0.5 relative z-1",
          title:
            "text-sm font-semibold text-highlighted leading-tight",
          description:
            "text-sm text-muted mt-1 leading-normal",
          iconWrapper: "relative z-1 flex shrink-0",
          icon: "w-5 h-5 mt-0.5 shrink-0",
          actions: "mt-2.5 flex items-center gap-2",
          closeTrigger:
            "p-1 -m-1 rounded-md text-dimmed hover:text-default transition-colors shrink-0 relative z-1",
          progress: "h-0.5",
        },
        native: {
          root: "flex flex-col items-center justify-center p-4 rounded-2xl bg-neutral-900/75 backdrop-blur-[2px] border border-white/5 shadow-md text-center min-w-[120px] max-w-[200px] min-h-[100px] text-white",
          wrapper: "flex flex-col items-center justify-center text-center",
          title: "text-sm font-medium text-center text-white leading-snug",
          description: "text-xs text-white/85 text-center mt-1",
          iconWrapper: "flex items-center justify-center shrink-0",
          icon: "w-9 h-9 mb-1.5 text-white shrink-0",
        },
      },
      color: Object.assign(
        Object.fromEntries(colors.map((color) => [color, {}])),
        { neutral: {} },
      ),
      variant: {
        outline: {},
        solid: {
          root: "text-white border-transparent",
          title: "text-white",
          description: "text-white/85",
          closeTrigger: "text-white/70 hover:text-white",
          icon: "text-white",
          progressRange: "bg-white",
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
          root: "fixed top-0 left-1/2 w-[calc(100vw_-_32px)] max-w-sm md:max-w-md mt-[calc(var(--cui-toast-top-offset,env(safe-area-inset-top,0px))_+_var(--spacing)_*_4)] z-toast",
        },
        center: {
          root: "fixed top-1/2 left-1/2 w-[calc(100vw_-_32px)] max-w-sm md:max-w-md z-toast",
        },
        bottom: {
          root: "fixed bottom-0 left-1/2 w-[calc(100vw_-_32px)] max-w-sm md:max-w-md mb-[calc(var(--cui-toast-bottom-offset,env(safe-area-inset-bottom,0px))_+_var(--spacing)_*_4)] z-toast",
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
          root: "fixed top-0 left-1/2 w-auto mt-[calc(var(--cui-toast-top-offset,env(safe-area-inset-top,0px))_+_var(--spacing)_*_4)] z-toast",
        },
      },
      {
        mode: "native",
        placement: "center",
        class: {
          root: "fixed top-1/2 left-1/2 w-auto z-toast",
        },
      },
      {
        mode: "native",
        placement: "bottom",
        class: {
          root: "fixed bottom-0 left-1/2 w-auto mb-[calc(var(--cui-toast-bottom-offset,env(safe-area-inset-bottom,0px))_+_var(--spacing)_*_4)] z-toast",
        },
      },

      // 1. Outline (Web Default Style)
      ...colors.map((color) => ({
        color,
        variant: "outline" as const,
        mode: "default" as const,
        class: {
          icon: `text-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "outline" as const,
        mode: "default" as const,
        class: {
          icon: "text-highlighted",
        },
      },

      // 2. Solid
      ...colors.map((color) => ({
        color,
        variant: "solid" as const,
        mode: "default" as const,
        class: {
          root: `bg-${color} border-transparent text-white`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "solid" as const,
        mode: "default" as const,
        class: {
          root: "bg-inverted text-inverted border-inverted",
          title: "text-inverted",
          description: "text-inverted",
          closeTrigger: "text-inverted",
          icon: "text-inverted",
          progressRange: "bg-default",
        },
      },

      // 3. Soft
      ...colors.map((color) => ({
        color,
        variant: "soft" as const,
        mode: "default" as const,
        class: {
          root: `bg-default border-transparent text-${color}`,
          tint: `bg-${color}/10`,
          title: `text-${color}`,
          description: `text-${color}/80`,
          icon: `text-${color}`,
          closeTrigger: `text-${color}/70 hover:text-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "soft" as const,
        mode: "default" as const,
        class: {
          root: "bg-elevated border-transparent text-highlighted",
          title: "text-highlighted",
          description: "text-toned",
          icon: "text-default",
          closeTrigger: "text-muted hover:text-highlighted",
        },
      },

      // 4. Subtle
      ...colors.map((color) => ({
        color,
        variant: "subtle" as const,
        mode: "default" as const,
        class: {
          root: `bg-default border-${color}/20 text-${color}`,
          tint: `bg-${color}/10`,
          title: `text-${color}`,
          description: `text-${color}/80`,
          icon: `text-${color}`,
          closeTrigger: `text-${color}/70 hover:text-${color}`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "subtle" as const,
        mode: "default" as const,
        class: {
          root: "bg-elevated border-default text-highlighted",
          title: "text-highlighted",
          description: "text-toned",
          icon: "text-default",
          closeTrigger: "text-muted hover:text-highlighted",
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
