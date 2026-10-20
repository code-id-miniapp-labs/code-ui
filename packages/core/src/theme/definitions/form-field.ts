import { defineTheme, type ThemeOptions } from "../../theme";

export default function formFieldTheme(options: ThemeOptions = {}) {
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "flex flex-col gap-1.5 w-full",
      wrapper: "flex flex-col gap-0.5",
      labelWrapper: "flex items-center justify-between gap-1.5",
      label: "block text-sm font-medium text-neutral-800",
      container: "relative w-full",
      description: "text-xs text-neutral-500",
      error: `text-xs text-${errorColor} font-medium mt-0.5`,
      hint: "text-xs text-neutral-400",
      help: "text-xs text-neutral-500 mt-0.5",
      required: `text-xs text-${errorColor} font-bold`,
    },
    variants: {
      size: {
        xs: {
          root: "gap-1",
          label: "text-xs",
          description: "text-[11px]",
          error: "text-[11px]",
          help: "text-[11px]",
          hint: "text-[11px]",
        },
        sm: {
          root: "gap-1",
          label: "text-xs",
          description: "text-xs",
          error: "text-xs",
          help: "text-xs",
          hint: "text-xs",
        },
        md: {
          root: "gap-1.5",
          label: "text-sm",
          description: "text-xs",
          error: "text-xs",
          help: "text-xs",
          hint: "text-xs",
        },
        lg: {
          root: "gap-2",
          label: "text-base",
          description: "text-sm",
          error: "text-sm",
          help: "text-sm",
          hint: "text-sm",
        },
        xl: {
          root: "gap-2.5",
          label: "text-lg",
          description: "text-base",
          error: "text-sm",
          help: "text-sm",
          hint: "text-sm",
        },
      },
      disabled: {
        true: {
          root: "opacity-60 pointer-events-none",
        },
        false: {
          root: "",
        },
      },
      required: {
        true: {},
        false: {},
      },
    },
    compoundVariants: [],
    defaultVariants: {
      size: "md",
      disabled: false,
      required: false,
    },
  });
}
