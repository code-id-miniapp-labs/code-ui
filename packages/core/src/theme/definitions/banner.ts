import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function bannerTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "relative w-full z-50 transition-colors pointer-events-auto box-border data-[state=dismissing]:opacity-0 data-[state=dismissing]:-translate-y-2",
      background:
        "relative flex flex-col justify-center mx-auto w-full transition-colors",
      body: "flex items-center justify-between w-full gap-3",
      content: "flex flex-col min-w-0 flex-1 justify-center gap-0.5",
      badge: "inline-flex items-center self-start",
      caption: "text-neutral leading-tight truncate",
      title: "font-medium leading-tight line-clamp-2",
      description: "opacity-90 leading-tight",
      imageArea: "shrink-0 overflow-hidden flex items-center justify-center",
      image: "w-full h-full object-cover",
      icon: "shrink-0",
      buttonArea:
        "flex flex-col justify-between items-center self-start shrink-0 gap-2",
      close:
        "rounded-md transition-opacity opacity-75 hover:opacity-100 shrink-0 cursor-pointer flex items-center justify-center text-inherit",
      closeIcon: "w-4 h-4",
      more: "rounded-md transition-opacity opacity-75 hover:opacity-100 shrink-0 cursor-pointer flex items-center justify-center text-inherit",
      moreIcon: "w-4 h-4",
      actions:
        "flex items-center justify-around divide-x w-full border-t mt-2 pt-2",
      action: "flex-1",
      actionButton: "text-inherit",
      actionIcon: "w-3.5 h-3.5",
    },
    variants: {
      mode: {
        fixed: {
          root: "fixed left-0 right-0 z-[90]",
        },
        inline: {
          root: "relative w-full z-0 rounded-md overflow-hidden",
          background: "rounded-md overflow-hidden",
        },
      },
      placement: {
        top: {
          root: "top-0",
        },
        bottom: {
          root: "bottom-0 data-[state=dismissing]:translate-y-2",
        },
        inline: {
          root: "relative",
        },
      },
      color: Object.assign(
        Object.fromEntries(colors.map((color) => [color, {}])),
        { neutral: {} },
      ),
      variant: {
        solid: {},
        outline: {},
        soft: {
          root: "bg-default",
        },
        subtle: {
          root: "bg-default",
        },
      },
      size: {
        xs: {
          background: "py-1.5 px-2.5 md:px-4 gap-2",
          title: "text-xs",
          description: "text-2xs",
          caption: "text-3xs",
          icon: "w-3.5 h-3.5",
          close: "p-0.5 -mr-0.5",
          more: "p-0.5 -mr-0.5",
        },
        sm: {
          background: "py-2 px-3 md:px-5 gap-2",
          title: "text-xs sm:text-sm",
          description: "text-2xs",
          caption: "text-2xs",
          icon: "w-4 h-4",
          close: "p-1 -mr-1",
          more: "p-1 -mr-1",
        },
        md: {
          background: "py-2.5 px-3 md:px-6 gap-2.5",
          title: "text-sm",
          description: "text-xs",
          caption: "text-sm",
          icon: "w-4.5 h-4.5",
          close: "p-1 -mr-1",
          more: "p-1 -mr-1",
        },
        lg: {
          background: "py-3 px-3.5 md:px-6 gap-3",
          title: "text-base",
          description: "text-sm",
          caption: "text-xs",
          icon: "w-5 h-5",
          close: "p-1.5 -mr-1",
          more: "p-1.5 -mr-1",
        },
        xl: {
          background: "py-3.5 px-4 md:px-8 gap-3.5",
          title: "text-lg",
          description: "text-base",
          caption: "text-sm",
          icon: "w-6 h-6",
          close: "p-1.5 -mr-1",
          more: "p-1.5 -mr-1",
        },
      },
      imageShape: {
        square: {
          imageArea: "w-14 h-14 rounded-lg overflow-hidden shrink-0",
        },
        rect: {
          imageArea: "w-20 h-14 rounded-lg overflow-hidden shrink-0",
        },
        full: {
          imageArea: "w-24 aspect-square shrink-0 overflow-hidden rounded-lg",
        },
      },
      imagePosition: {
        none: {
          imageArea: "hidden",
          image: "hidden",
        },
        left: {
          imageArea: "shrink-0 overflow-hidden",
        },
        right: {
          imageArea: "shrink-0 overflow-hidden",
        },
        background: {
          root: "overflow-hidden",
          imageArea: "absolute inset-0 w-full h-full",
          image: "w-full h-full opacity-40 object-cover",
          content: "relative z-10",
        },
      },
    },
    compoundVariants: [
      ...colors.map((color) => ({
        color,
        variant: "solid" as const,
        class: {
          background:
            color === "warning"
              ? "bg-warning text-neutral-950"
              : `bg-${color} text-white`,
          icon: color === "warning" ? "text-neutral-950" : "text-white",
          close:
            color === "warning"
              ? "text-neutral-950/80 hover:text-neutral-950"
              : "text-white/80 hover:text-white",
          more:
            color === "warning"
              ? "text-neutral-950/80 hover:text-neutral-950"
              : "text-white/80 hover:text-white",
          actions:
            color === "warning"
              ? "border-neutral-950/15 divide-neutral-950/15"
              : "border-white/20 divide-white/20",
        },
      })),
      {
        color: "neutral" as const,
        variant: "solid" as const,
        class: {
          background: "bg-inverted text-inverted",
          icon: "text-inverted",
          close: "text-inverted/80 hover:text-inverted",
          more: "text-inverted/80 hover:text-inverted",
          actions: "border-accented/30 divide-accented/30",
        },
      },

      ...colors.map((color) => ({
        color,
        variant: "outline" as const,
        class: {
          background: `bg-default border border-${color}/30 text-highlighted`,
          icon: `text-${color}`,
          close: "text-muted hover:text-default",
          more: "text-muted hover:text-default",
          actions: `border-${color}/20 divide-${color}/20`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "outline" as const,
        class: {
          background: "bg-default border border-default text-highlighted",
          icon: "text-highlighted",
          close: "text-muted hover:text-default",
          more: "text-muted hover:text-default",
          actions: "border-default divide-default",
        },
      },

      ...colors.map((color) => ({
        color,
        variant: "soft" as const,
        class: {
          background: `bg-${color}/10 text-${color}`,
          icon: `text-${color}`,
          close: `text-${color}/70 hover:text-${color}`,
          more: `text-${color}/70 hover:text-${color}`,
          actions: `border-${color}/20 divide-${color}/20`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "soft" as const,
        class: {
          background: "bg-elevated text-highlighted",
          icon: "text-default",
          close: "text-muted hover:text-default",
          more: "text-muted hover:text-default",
          actions: "border-default divide-default",
        },
      },

      ...colors.map((color) => ({
        color,
        variant: "subtle" as const,
        class: {
          background: `bg-${color}/10 border-b border-${color}/20 text-${color}`,
          icon: `text-${color}`,
          close: `text-${color}/70 hover:text-${color}`,
          more: `text-${color}/70 hover:text-${color}`,
          actions: `border-${color}/20 divide-${color}/20`,
        },
      })),
      {
        color: "neutral" as const,
        variant: "subtle" as const,
        class: {
          background:
            "bg-elevated border-b border-default text-highlighted",
          icon: "text-default",
          close: "text-muted hover:text-default",
          more: "text-muted hover:text-default",
          actions: "border-default divide-default",
        },
      },
    ],
    defaultVariants: {
      color: "primary",
      variant: "solid",
      mode: "fixed",
      placement: "top",
      size: "md",
      imagePosition: "none",
      imageShape: "rect",
    },
  });
}
