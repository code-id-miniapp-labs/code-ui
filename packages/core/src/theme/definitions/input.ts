import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function inputTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative inline-flex items-center w-full",
      base: "w-full rounded-lg border text-neutral-900 transition-colors focus:outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400",
      leading:
        "absolute inset-y-0 start-0 flex items-center justify-center pointer-events-none text-neutral-400",
      leadingIcon: "shrink-0",
      trailing:
        "absolute inset-y-0 end-0 flex items-center justify-center text-neutral-400",
      trailingIcon: "shrink-0",
      clear:
        "cursor-pointer pointer-events-auto transition-colors hover:text-neutral-700",
    },
    variants: {
      color: createColorVariants(colors),
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
          base: "bg-transparent text-neutral-900 border-transparent",
        },
        none: {
          base: "bg-transparent text-neutral-900 border-0",
        },
      },
      size: {
        xs: {
          base: "h-7 text-xs px-2",
          leading: "ps-2",
          trailing: "pe-2",
          leadingIcon: "w-3.5 h-3.5",
          trailingIcon: "w-3.5 h-3.5",
          clear: "text-xs",
        },
        sm: {
          base: "h-8 text-xs px-2.5",
          leading: "ps-2.5",
          trailing: "pe-2.5",
          leadingIcon: "w-4 h-4",
          trailingIcon: "w-4 h-4",
          clear: "text-xs",
        },
        md: {
          base: "h-9 text-sm px-3",
          leading: "ps-3",
          trailing: "pe-3",
          leadingIcon: "w-4 h-4",
          trailingIcon: "w-4 h-4",
          clear: "text-sm",
        },
        lg: {
          base: "h-10 text-base px-3.5",
          leading: "ps-3.5",
          trailing: "pe-3.5",
          leadingIcon: "w-5 h-5",
          trailingIcon: "w-5 h-5",
          clear: "text-base",
        },
        xl: {
          base: "h-11 text-lg px-4",
          leading: "ps-4",
          trailing: "pe-4",
          leadingIcon: "w-5 h-5",
          trailingIcon: "w-5 h-5",
          clear: "text-base",
        },
      },
      leading: {
        true: {
          base: "",
        },
        false: {
          base: "",
        },
      },
      trailing: {
        true: {
          base: "",
        },
        false: {
          base: "",
        },
      },
      highlight: {
        true: {
          base: "",
        },
        false: {
          base: "",
        },
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
        true: {
          base: "",
        },
        false: {
          base: "",
        },
      },
    },
    compoundVariants: [
      {
        leading: true,
        size: "xs",
        class: {
          base: "ps-7",
        },
      },
      {
        leading: true,
        size: "sm",
        class: {
          base: "ps-8",
        },
      },
      {
        leading: true,
        size: "md",
        class: {
          base: "ps-9",
        },
      },
      {
        leading: true,
        size: "lg",
        class: {
          base: "ps-10",
        },
      },
      {
        leading: true,
        size: "xl",
        class: {
          base: "ps-11",
        },
      },
      {
        trailing: true,
        size: "xs",
        class: {
          base: "pe-7",
        },
      },
      {
        trailing: true,
        size: "sm",
        class: {
          base: "pe-8",
        },
      },
      {
        trailing: true,
        size: "md",
        class: {
          base: "pe-9",
        },
      },
      {
        trailing: true,
        size: "lg",
        class: {
          base: "pe-10",
        },
      },
      {
        trailing: true,
        size: "xl",
        class: {
          base: "pe-11",
        },
      },
      ...(colors as readonly string[]).flatMap((color) => [
        {
          color: color as (typeof colors)[number],
          variant: ["outline", "subtle", "soft"] as any,
          class: {
            base: `focus:border-${color} focus:ring-2 focus:ring-${color}/20 data-[focused=true]:border-${color} data-[focused=true]:ring-2 data-[focused=true]:ring-${color}/20`,
          },
        },
        {
          color: color as (typeof colors)[number],
          highlight: true as const,
          class: {
            base: `border-${color} ring-2 ring-${color}/20`,
          },
        },
      ]),
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
