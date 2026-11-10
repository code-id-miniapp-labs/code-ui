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
      root: "w-full transition-all duration-200 box-border pointer-events-auto border data-[state=dismissing]:opacity-0 data-[state=dismissing]:-translate-y-2",
      wrapper: "flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2",
      title: "text-sm font-semibold leading-tight",
      description: "text-xs leading-normal mt-0.5 opacity-80",
      icon: "w-5 h-5 shrink-0",
      actions: "flex items-center gap-2 shrink-0 flex-wrap mt-2 md:mt-0",
      action: "",
      closeTrigger: "p-1 -mr-1 rounded-md transition-opacity opacity-75 hover:opacity-100 shrink-0 cursor-pointer",
    },
    variants: {
      mode: {
        fixed: {
          root: "fixed left-0 right-0 z-[90] shadow-sm",
        },
        inline: {
          root: "relative w-full z-0",
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
        outline: {
          root: "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white px-4 py-3 flex items-start gap-3",
        },
        solid: {
          root: "text-white border-transparent px-4 py-3 flex items-start gap-3",
        },
        soft: {
          root: "border-transparent px-4 py-3 flex items-start gap-3",
        },
        subtle: {
          root: "border px-4 py-3 flex items-start gap-3",
        },
      },
    },
    compoundVariants: [
      // 1. Outline
      ...semanticColors.map((color) => ({
        color: color as (typeof colors)[number],
        variant: "outline" as const,
        class: {
          icon: `text-${color}`,
        },
      })),
      ...(hasNeutral
        ? [
            {
              color: "neutral" as (typeof colors)[number],
              variant: "outline" as const,
              class: {
                icon: "text-neutral-900 dark:text-white",
              },
            },
          ]
        : []),

      // 2. Solid
      ...semanticColors.map((color) => ({
        color: color as (typeof colors)[number],
        variant: "solid" as const,
        class: {
          root: `bg-${color} border-transparent text-white`,
        },
      })),
      ...(hasNeutral
        ? [
            {
              color: "neutral" as (typeof colors)[number],
              variant: "solid" as const,
              class: {
                root: "bg-neutral-900 text-white border-neutral-800 dark:bg-neutral-800 dark:border-neutral-700",
              },
            },
          ]
        : []),

      // 3. Soft
      ...semanticColors.map((color) => ({
        color: color as (typeof colors)[number],
        variant: "soft" as const,
        class: {
          root: `bg-${color}/10 border-transparent text-${color}`,
        },
      })),
      ...(hasNeutral
        ? [
            {
              color: "neutral" as (typeof colors)[number],
              variant: "soft" as const,
              class: {
                root: "bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-900 dark:text-white",
              },
            },
          ]
        : []),

      // 4. Subtle
      ...semanticColors.map((color) => ({
        color: color as (typeof colors)[number],
        variant: "subtle" as const,
        class: {
          root: `bg-${color}/10 border-${color}/20 text-${color}`,
        },
      })),
      ...(hasNeutral
        ? [
            {
              color: "neutral" as (typeof colors)[number],
              variant: "subtle" as const,
              class: {
                root: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white",
              },
            },
          ]
        : []),
    ],
    defaultVariants: {
      color: "primary",
      variant: "soft",
      mode: "fixed",
      placement: "top",
    },
  });
}
