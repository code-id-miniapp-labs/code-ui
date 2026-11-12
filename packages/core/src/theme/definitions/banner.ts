import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function bannerTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;
  const semanticColors = (colors as readonly string[]).filter(
    (c) => c !== "neutral",
  );
  const hasNeutral = (colors as readonly string[]).includes("neutral");

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
      more: "rounded-md transition-opacity opacity-75 hover:opacity-100 shrink-0 cursor-pointer flex items-center justify-center text-inherit",
      actions:
        "flex items-center justify-around divide-x w-full border-t mt-2 pt-2",
      action: "flex-1",
    },
    variants: {
      mode: {
        fixed: {
          root: "fixed left-0 right-0 z-[90]",
        },
        inline: {
          root: "relative w-full z-0",
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
      color: createColorVariants(colors),
      variant: {
        solid: {},
        outline: {},
        soft: {},
        subtle: {},
      },
      size: {
        xs: {
          background: "py-1.5 px-2.5 gap-2",
          title: "text-xs",
          description: "text-[10px]",
          caption: "text-[9px]",
          icon: "w-3.5 h-3.5",
          close: "p-0.5 -mr-0.5",
          more: "p-0.5 -mr-0.5",
        },
        sm: {
          background: "py-2 px-3 gap-2",
          title: "text-xs sm:text-sm",
          description: "text-[11px]",
          caption: "text-[10px]",
          icon: "w-4 h-4",
          close: "p-1 -mr-1",
          more: "p-1 -mr-1",
        },
        md: {
          background: "py-2.5 px-3 gap-2.5",
          title: "text-sm",
          description: "text-xs",
          caption: "text-sm",
          icon: "w-4.5 h-4.5",
          close: "p-1 -mr-1",
          more: "p-1 -mr-1",
        },
        lg: {
          background: "py-3 px-3.5 gap-3",
          title: "text-base",
          description: "text-sm",
          caption: "text-xs",
          icon: "w-5 h-5",
          close: "p-1.5 -mr-1",
          more: "p-1.5 -mr-1",
        },
        xl: {
          background: "py-3.5 px-4 gap-3.5",
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
      ...semanticColors.map((color) => ({
        color: color as (typeof colors)[number],
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
      ...(hasNeutral
        ? [
            {
              color: "neutral" as (typeof colors)[number],
              variant: "solid" as const,
              class: {
                background: "bg-neutral-900 text-white dark:bg-neutral-800",
                icon: "text-white",
                close: "text-white/80 hover:text-white",
                more: "text-white/80 hover:text-white",
                actions: "border-white/20 divide-white/20",
              },
            },
          ]
        : []),

      ...semanticColors.map((color) => ({
        color: color as (typeof colors)[number],
        variant: "outline" as const,
        class: {
          background: `bg-white dark:bg-neutral-900 border border-${color}/30 text-neutral-900 dark:text-white`,
          icon: `text-${color}`,
          close:
            "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white",
          more: "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white",
          actions: `border-${color}/20 divide-${color}/20`,
        },
      })),
      ...(hasNeutral
        ? [
            {
              color: "neutral" as (typeof colors)[number],
              variant: "outline" as const,
              class: {
                background:
                  "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white",
                icon: "text-neutral-900 dark:text-white",
                close:
                  "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white",
                more: "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white",
                actions:
                  "border-neutral-200 dark:border-neutral-800 divide-neutral-200 dark:divide-neutral-800",
              },
            },
          ]
        : []),

      ...semanticColors.map((color) => ({
        color: color as (typeof colors)[number],
        variant: "soft" as const,
        class: {
          background: `bg-${color}/10 text-${color}`,
          icon: `text-${color}`,
          close: `text-${color}/70 hover:text-${color}`,
          more: `text-${color}/70 hover:text-${color}`,
          actions: `border-${color}/20 divide-${color}/20`,
        },
      })),
      ...(hasNeutral
        ? [
            {
              color: "neutral" as (typeof colors)[number],
              variant: "soft" as const,
              class: {
                background:
                  "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white",
                icon: "text-neutral-700 dark:text-neutral-300",
                close:
                  "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white",
                more: "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white",
                actions:
                  "border-neutral-200 dark:border-neutral-700 divide-neutral-200 dark:divide-neutral-700",
              },
            },
          ]
        : []),

      // 4. Subtle
      ...semanticColors.map((color) => ({
        color: color as (typeof colors)[number],
        variant: "subtle" as const,
        class: {
          background: `bg-${color}/10 border-b border-${color}/20 text-${color}`,
          icon: `text-${color}`,
          close: `text-${color}/70 hover:text-${color}`,
          more: `text-${color}/70 hover:text-${color}`,
          actions: `border-${color}/20 divide-${color}/20`,
        },
      })),
      ...(hasNeutral
        ? [
            {
              color: "neutral" as (typeof colors)[number],
              variant: "subtle" as const,
              class: {
                background:
                  "bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white",
                icon: "text-neutral-700 dark:text-neutral-300",
                close:
                  "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white",
                more: "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white",
                actions:
                  "border-neutral-200 dark:border-neutral-700 divide-neutral-200 dark:divide-neutral-700",
              },
            },
          ]
        : []),
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
