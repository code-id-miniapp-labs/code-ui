import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function switchTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative inline-flex items-start select-none",
      base: "inline-flex items-center shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      container: "flex items-center",
      thumb:
        "pointer-events-none rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-out motion-reduce:transition-none flex items-center justify-center translate-y-0",
      icon: "shrink-0 transition-[color,opacity] duration-200 ease-out",
      wrapper: "ms-2 flex flex-col justify-center",
      label: "block font-medium text-neutral-900 leading-snug",
      description: "text-neutral-500 leading-snug",
    },
    variants: {
      color: createColorVariants(colors),
      size: {
        xs: {
          base: "w-7 h-4",
          thumb: "w-3 h-3",
          icon: "w-2.5 h-2.5",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-[20rpx]",
        },
        sm: {
          base: "w-8 h-4.5",
          thumb: "w-3.5 h-3.5",
          icon: "w-3 h-3",
          wrapper: "text-xs",
          label: "text-xs",
          description: "text-[22rpx]",
        },
        md: {
          base: "w-9 h-5",
          thumb: "w-4 h-4",
          icon: "w-3.5 h-3.5",
          wrapper: "text-sm",
          label: "text-sm",
          description: "text-xs",
        },
        lg: {
          base: "w-10 h-5.5",
          thumb: "w-4.5 h-4.5",
          icon: "w-4 h-4",
          wrapper: "text-base",
          label: "text-base",
          description: "text-sm",
        },
        xl: {
          base: "w-11 h-6",
          thumb: "w-5 h-5",
          icon: "w-4.5 h-4.5",
          wrapper: "text-base",
          label: "text-base",
          description: "text-sm",
        },
      },
      disabled: {
        true: {
          root: "opacity-60 cursor-not-allowed pointer-events-none",
          base: "cursor-not-allowed",
        },
        false: {},
      },
      checked: {
        true: {
          icon: "opacity-100",
        },
        false: {
          base: "bg-neutral-200",
          thumb: "translate-x-0 rtl:-translate-x-0",
          icon: "opacity-0",
        },
      },
      loading: {
        true: {
          root: "opacity-80 pointer-events-none",
        },
        false: {},
      },
      required: {
        true: {
          label: `after:content-['*'] after:ms-0.5 after:text-${errorColor}`,
        },
        false: {},
      },
      invalid: {
        true: {
          base: `ring-1 ring-${errorColor}`,
        },
        false: {},
      },
    },
    compoundVariants: [
      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        checked: true,
        class: {
          base: `bg-${color}`,
          icon: `text-${color}`,
        },
      })),
      {
        invalid: true,
        checked: true,
        class: {
          base: `bg-${errorColor}`,
          icon: `text-${errorColor}`,
        },
      },
      {
        size: "xs",
        checked: true,
        class: {
          thumb: "translate-x-3 rtl:-translate-x-3",
        },
      },
      {
        size: "sm",
        checked: true,
        class: {
          thumb: "translate-x-3.5 rtl:-translate-x-3.5",
        },
      },
      {
        size: "md",
        checked: true,
        class: {
          thumb: "translate-x-4 rtl:-translate-x-4",
        },
      },
      {
        size: "lg",
        checked: true,
        class: {
          thumb: "translate-x-4.5 rtl:-translate-x-4.5",
        },
      },
      {
        size: "xl",
        checked: true,
        class: {
          thumb: "translate-x-5 rtl:-translate-x-5",
        },
      },
    ],
    defaultVariants: {
      color: "primary",
      size: "md",
      disabled: false,
      checked: false,
      loading: false,
      required: false,
      invalid: false,
    },
  });
}
