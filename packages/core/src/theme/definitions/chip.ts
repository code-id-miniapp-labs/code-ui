import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function chipTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "relative inline-flex items-center justify-center shrink-0",
      base: "rounded-full ring-2 ring-white flex items-center justify-center text-white font-medium leading-none whitespace-nowrap",
    },
    variants: {
      color: createColorVariants(colors),
      size: {
        "3xs": {
          base: "h-[4px] min-w-[4px] text-[4px]",
        },
        "2xs": {
          base: "h-[5px] min-w-[5px] text-[5px]",
        },
        xs: {
          base: "h-1.5 min-w-1.5 text-[6px]",
        },
        sm: {
          base: "h-2 min-w-2 text-[7px]",
        },
        md: {
          base: "h-2.5 min-w-2.5 text-[8px] px-0.5",
        },
        lg: {
          base: "h-3 min-w-3 text-[9px] px-1",
        },
        xl: {
          base: "h-3.5 min-w-3.5 text-[10px] px-1",
        },
        "2xl": {
          base: "h-4 min-w-4 text-[11px] px-1",
        },
        "3xl": {
          base: "h-5 min-w-5 text-xs px-1.5",
        },
      },
      position: {
        "top-right": {
          base: "top-0 right-0",
        },
        "bottom-right": {
          base: "bottom-0 right-0",
        },
        "top-left": {
          base: "top-0 left-0",
        },
        "bottom-left": {
          base: "bottom-0 left-0",
        },
      },
      inset: {
        true: {
          base: "",
        },
        false: {
          base: "",
        },
      },
      standalone: {
        true: {
          base: "relative",
        },
        false: {
          base: "absolute",
        },
      },
    },
    compoundVariants: [
      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        class: {
          base: `bg-${color}`,
        },
      })),
      {
        position: "top-right",
        inset: false,
        standalone: false,
        class: {
          base: "-translate-y-1/2 translate-x-1/2 transform",
        },
      },
      {
        position: "bottom-right",
        inset: false,
        standalone: false,
        class: {
          base: "translate-y-1/2 translate-x-1/2 transform",
        },
      },
      {
        position: "top-left",
        inset: false,
        standalone: false,
        class: {
          base: "-translate-y-1/2 -translate-x-1/2 transform",
        },
      },
      {
        position: "bottom-left",
        inset: false,
        standalone: false,
        class: {
          base: "translate-y-1/2 -translate-x-1/2 transform",
        },
      },
    ],
    defaultVariants: {
      size: "md",
      color: "primary",
      position: "top-right",
      inset: false,
      standalone: false,
    },
  });
}
