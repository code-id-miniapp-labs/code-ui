import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function tourTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "fixed inset-0 z-tour overflow-hidden pointer-events-none box-border",
      backdrop: "fixed pointer-events-auto",
      spotlight: "fixed box-border border-2 border-solid",
      positioner: "fixed z-20 pointer-events-none box-border",
      content:
        "pointer-events-auto relative flex flex-col w-full rounded-xl bg-default text-default border border-muted shadow-2xl box-border",
      arrow:
        "absolute w-2.5 h-2.5 bg-default border-muted pointer-events-none",
      header: "relative flex flex-col shrink-0 box-border w-full px-4 pt-4 pb-2",
      wrapper: "flex flex-col gap-1 min-w-0 w-full",
      badge:
        "inline-flex items-center self-start px-2 py-0.5 mb-0.5 rounded-full text-2xs font-semibold tracking-wide",
      title:
        "text-base font-semibold tracking-tight text-highlighted leading-snug",
      description: "text-xs text-muted leading-relaxed",
      closeTrigger:
        "absolute top-3 right-3 z-20 inline-flex items-center justify-center w-6 h-6 rounded-full bg-elevated text-muted shrink-0 cursor-pointer active:opacity-70 transition-opacity",
      closeButton: "p-0 w-full h-full rounded-full text-inherit",
      closeIcon: "w-3.5 h-3.5",
      body: "w-full box-border px-4 pb-3 text-sm text-default leading-relaxed",
      footer:
        "flex items-center justify-between gap-2.5 px-4 py-3 border-t border-muted shrink-0 box-border w-full",
      progressText: "text-xs font-medium text-muted tabular-nums shrink-0",
      progress: "flex items-center gap-1.5 shrink-0",
      progressDot: "w-1.5 h-1.5 rounded-full bg-accented transition-[width,background-color] duration-200",
      progressDotActive: "w-4 h-1.5 rounded-full transition-[width,background-color] duration-200",
      actions: "flex items-center justify-end gap-2 ml-auto shrink-0",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(
          colors.map((color) => [
            color,
            {
              spotlight: `border-${color}`,
              badge: `bg-${color}/15 text-${color}`,
              progressDotActive: `bg-${color}`,
            },
          ]),
        ),
        {
          neutral: {
            spotlight: "border-inverted",
            badge: "bg-elevated text-highlighted",
            progressDotActive: "bg-inverted",
          },
        },
      ),
      size: {
        xs: {
          header: "px-3 pt-3 pb-1.5",
          title: "text-sm",
          description: "text-2xs",
          body: "px-3 pb-2.5 text-xs",
          footer: "px-3 py-2.5 gap-2",
        },
        sm: {
          header: "px-3.5 pt-3.5 pb-2",
          title: "text-sm",
          description: "text-xs",
          body: "px-3.5 pb-2.5 text-xs",
          footer: "px-3.5 py-2.5 gap-2",
        },
        md: {
          header: "px-4 pt-4 pb-2",
          title: "text-base",
          description: "text-xs",
          body: "px-4 pb-3 text-sm",
          footer: "px-4 py-3 gap-2.5",
        },
        lg: {
          header: "px-5 pt-5 pb-2.5",
          title: "text-lg",
          description: "text-sm",
          body: "px-5 pb-4 text-sm",
          footer: "px-5 py-3.5 gap-3",
        },
      },
      spotlight: {
        true: {
          backdrop: "bg-transparent",
        },
        false: {
          backdrop: "inset-0 bg-black/55",
        },
      },
      closable: {
        true: {
          header: "pr-11",
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
        right: {
          arrow: "border-b border-l",
        },
        left: {
          arrow: "border-t border-r",
        },
        center: {},
      },
      transition: {
        true: {
          backdrop: "transition-opacity duration-200 ease-out",
          spotlight: "transition-[top,left,width,height,opacity] duration-200 ease-out",
          positioner: "transition-[transform,opacity] duration-200 ease-out will-change-transform",
          content: "transition-[transform,opacity] duration-200 ease-out will-change-transform",
        },
        false: {
          backdrop: "transition-none",
          spotlight: "transition-none",
          positioner: "transition-none",
          content: "transition-none",
        },
      },
      open: {
        true: {
          backdrop: "opacity-100 pointer-events-auto",
          spotlight: "opacity-100",
          content: "opacity-100 scale-100",
        },
        false: {
          backdrop: "opacity-0 pointer-events-none",
          spotlight: "opacity-0",
          content: "opacity-0 scale-95 pointer-events-none",
        },
      },
    },
    defaultVariants: {
      color: "primary",
      size: "md",
      spotlight: false,
      closable: true,
      side: "bottom",
      transition: true,
      open: false,
    },
  });
}
