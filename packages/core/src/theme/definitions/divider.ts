import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function dividerTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "flex items-center w-full",
      container: "flex items-center gap-2 shrink-0",
      border: "flex-1 border-t",
      icon: "shrink-0",
      label: "shrink-0",
    },
    variants: {
      color: createColorVariants(colors),
      size: {
        xs: {
          container: "text-[10px]",
          border: "border-t-[1px]",
        },
        sm: {
          container: "text-xs",
          border: "border-t-[1px]",
        },
        md: {
          container: "text-sm",
          border: "border-t-[1px]",
        },
        lg: {
          container: "text-base",
          border: "border-t-[1px]",
        },
        xl: {
          container: "text-lg",
          border: "border-t-[1px]",
        },
      },
      type: {
        solid: {
          border: "border-solid",
        },
        dashed: {
          border: "border-dashed",
        },
        dotted: {
          border: "border-dotted",
        },
      },
      orientation: {
        horizontal: {
          root: "flex-row",
          border: "border-t",
        },
        vertical: {
          root: "flex-col",
          border: "border-l border-t-0",
        },
      },
      position: {
        center: {
          // handled in WXML logic
        },
        start: {
          // handled in WXML logic
        },
        end: {
          // handled in WXML logic
        },
      },
    },
    compoundVariants: [
      {
        orientation: "horizontal",
        position: "start",
        class: {
          container: "me-3",
        },
      },
      {
        orientation: "horizontal",
        position: "center",
        class: {
          container: "mx-3",
        },
      },
      {
        orientation: "horizontal",
        position: "end",
        class: {
          container: "ms-3",
        },
      },
      {
        orientation: "vertical",
        position: "start",
        class: {
          container: "mb-2",
        },
      },
      {
        orientation: "vertical",
        position: "center",
        class: {
          container: "my-2",
        },
      },
      {
        orientation: "vertical",
        position: "end",
        class: {
          container: "mt-2",
        },
      },
      {
        orientation: "horizontal",
        size: "xs",
        class: {
          border: "border-t",
        },
      },
      {
        orientation: "horizontal",
        size: "sm",
        class: {
          border: "border-t-[2px]",
        },
      },
      {
        orientation: "horizontal",
        size: "md",
        class: {
          border: "border-t-[3px]",
        },
      },
      {
        orientation: "horizontal",
        size: "lg",
        class: {
          border: "border-t-[4px]",
        },
      },
      {
        orientation: "horizontal",
        size: "xl",
        class: {
          border: "border-t-[5px]",
        },
      },
      {
        orientation: "vertical",
        size: "xs",
        class: {
          border: "border-s",
        },
      },
      {
        orientation: "vertical",
        size: "sm",
        class: {
          border: "border-s-[2px]",
        },
      },
      {
        orientation: "vertical",
        size: "md",
        class: {
          border: "border-s-[3px]",
        },
      },
      {
        orientation: "vertical",
        size: "lg",
        class: {
          border: "border-s-[4px]",
        },
      },
      {
        orientation: "vertical",
        size: "xl",
        class: {
          border: "border-s-[5px]",
        },
      },
      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        class: {
          border: `border-${color}`,
        },
      })),
    ],
    defaultVariants: {
      color: "neutral",
      size: "xs",
      type: "solid",
      orientation: "horizontal",
      position: "center",
    },
  });
}
