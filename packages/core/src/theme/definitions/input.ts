import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function inputTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative flex items-center w-full",
      base: "relative w-full min-h-0 flex items-center overflow-hidden box-border rounded-lg border text-highlighted transition-colors focus:outline-none disabled:cursor-not-allowed disabled:bg-elevated disabled:text-dimmed",
      nativeInput:
        "flex-1 min-w-0 w-full min-h-0 bg-transparent border-0 p-0 m-0 font-sans text-inherit leading-normal placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:text-dimmed",
      leading:
        "shrink-0 flex items-center justify-center text-dimmed",
      leadingIcon:
        "inline-flex items-center justify-center shrink-0 leading-none",
      trailing:
        "shrink-0 flex items-center justify-center gap-1 text-dimmed",
      trailingIcon:
        "inline-flex items-center justify-center shrink-0 leading-none",
      iconInner: "w-full h-full block",
      loadingIcon: "w-full h-full block animate-spin",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(
          colors.map((color) => [
            color,
            {
              base: `focus:border-${color} focus:ring-2 focus:ring-${color}/20 data-[focused=true]:border-${color} data-[focused=true]:ring-2 data-[focused=true]:ring-${color}/20`,
            },
          ]),
        ),
        {
          neutral: {
            base: "focus:border-inverted focus:ring-2 focus:ring-inverted/20 data-[focused=true]:border-inverted data-[focused=true]:ring-2 data-[focused=true]:ring-inverted/20",
          },
        },
      ),
      variant: {
        outline: {
          base: "bg-default text-highlighted border-accented",
        },
        soft: {
          base: "bg-elevated text-highlighted border-transparent",
        },
        subtle: {
          base: "bg-elevated text-highlighted border-accented",
        },
        ghost: {
          base: "bg-transparent text-highlighted border-transparent focus:border-transparent focus:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
        },
        none: {
          base: "bg-transparent text-highlighted border-0 focus:border-transparent focus:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
        },
      },
      size: {
        xs: {
          base: "h-7 text-xs px-2 gap-1",
          leadingIcon: "size-3",
          trailingIcon: "size-3",
        },
        sm: {
          base: "h-8 text-xs px-2.5 gap-1.5",
          leadingIcon: "size-4",
          trailingIcon: "size-4",
        },
        md: {
          base: "h-9 text-sm px-3 gap-1.5",
          leadingIcon: "size-4",
          trailingIcon: "size-4",
        },
        lg: {
          base: "h-10 text-base px-3.5 gap-2",
          leadingIcon: "size-5",
          trailingIcon: "size-5",
        },
        xl: {
          base: "h-11 text-lg px-4 gap-2",
          leadingIcon: "size-5",
          trailingIcon: "size-5",
        },
      },
      leading: {
        true: { base: "" },
        false: { base: "" },
      },
      trailing: {
        true: { base: "" },
        false: { base: "" },
      },
      highlight: {
        true: { base: "" },
        false: { base: "" },
      },
      disabled: {
        true: {
          root: "opacity-60 cursor-not-allowed",
          base: "cursor-not-allowed bg-elevated text-dimmed",
        },
        false: {
          base: "",
        },
      },
      invalid: {
        true: { base: "" },
        false: { base: "" },
      },
    },
    compoundVariants: [
      ...colors.map((color) => ({
        color,
        highlight: true as const,
        class: {
          base: `border-${color} ring-2 ring-${color}/20`,
        },
      })),
      {
        color: "neutral" as const,
        highlight: true as const,
        class: {
          base: "border-inverted ring-2 ring-inverted/20",
        },
      },
      {
        invalid: true as const,
        class: {
          base: `border-${errorColor} ring-2 ring-${errorColor}/20 focus:border-${errorColor} focus:ring-2 focus:ring-${errorColor}/20 data-[focused=true]:border-${errorColor} data-[focused=true]:ring-2 data-[focused=true]:ring-${errorColor}/20`,
        },
      },
    ],
    defaultVariants: {
      variant: "outline",
      color: "primary",
      size: "md",
      leading: false,
      trailing: false,
      highlight: false,
      disabled: false,
      invalid: false,
    },
  });
}
