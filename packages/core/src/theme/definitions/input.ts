import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function inputTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative flex items-center w-full",
      base: "w-full box-border rounded-lg border text-neutral-900 transition-colors focus:outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400",
      leading:
        "absolute top-0 bottom-0 left-0 z-10 flex items-center justify-center pointer-events-none text-neutral-400",
      leadingIcon:
        "inline-flex items-center justify-center shrink-0 leading-none",
      trailing:
        "absolute top-0 bottom-0 right-0 z-10 flex items-center justify-center gap-1 text-neutral-400",
      trailingIcon:
        "inline-flex items-center justify-center shrink-0 leading-none",
    },
    variants: {
      color: Object.fromEntries(
        (colors as readonly string[]).map((color) => [
          color,
          {
            base: `focus:border-${color} focus:ring-2 focus:ring-${color}/20 data-[focused=true]:border-${color} data-[focused=true]:ring-2 data-[focused=true]:ring-${color}/20`,
          },
        ]),
      ),
      variant: {
        outline: {
          base: "bg-white text-neutral-900 border-neutral-300",
        },
        soft: {
          base: "bg-neutral-100/70 text-neutral-900 border-transparent",
        },
        subtle: {
          base: "bg-neutral-100 text-neutral-900 border-neutral-300",
        },
        ghost: {
          base: "bg-transparent text-neutral-900 border-transparent focus:border-transparent focus:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
        },
        none: {
          base: "bg-transparent text-neutral-900 border-0 focus:border-transparent focus:ring-0 data-[focused=true]:border-transparent data-[focused=true]:ring-0",
        },
      },
      size: {
        xs: {
          base: "h-7 text-xs px-2",
          leading: "pl-2",
          trailing: "pr-2",
          leadingIcon: "size-3",
          trailingIcon: "size-3",
        },
        sm: {
          base: "h-8 text-xs px-2.5",
          leading: "pl-2.5",
          trailing: "pr-2.5",
          leadingIcon: "size-4",
          trailingIcon: "size-4",
        },
        md: {
          base: "h-9 text-sm px-3",
          leading: "pl-3",
          trailing: "pr-3",
          leadingIcon: "size-4",
          trailingIcon: "size-4",
        },
        lg: {
          base: "h-10 text-base px-3.5",
          leading: "pl-3.5",
          trailing: "pr-3.5",
          leadingIcon: "size-5",
          trailingIcon: "size-5",
        },
        xl: {
          base: "h-11 text-lg px-4",
          leading: "pl-4",
          trailing: "pr-4",
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
          base: "cursor-not-allowed bg-neutral-100 text-neutral-400",
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
      {
        leading: true,
        size: "xs",
        class: { base: "pl-7" },
      },
      {
        leading: true,
        size: "sm",
        class: { base: "pl-8" },
      },
      {
        leading: true,
        size: "md",
        class: { base: "pl-9" },
      },
      {
        leading: true,
        size: "lg",
        class: { base: "pl-10" },
      },
      {
        leading: true,
        size: "xl",
        class: { base: "pl-11" },
      },
      {
        trailing: true,
        size: "xs",
        class: { base: "pr-7" },
      },
      {
        trailing: true,
        size: "sm",
        class: { base: "pr-8" },
      },
      {
        trailing: true,
        size: "md",
        class: { base: "pr-9" },
      },
      {
        trailing: true,
        size: "lg",
        class: { base: "pr-10" },
      },
      {
        trailing: true,
        size: "xl",
        class: { base: "pr-11" },
      },
      ...(colors as readonly string[]).map((color) => ({
        color: color as (typeof colors)[number],
        highlight: true as const,
        class: {
          base: `border-${color} ring-2 ring-${color}/20`,
        },
      })),
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
