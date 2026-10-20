import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function textareaTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative flex flex-col w-full box-border rounded-lg border transition-colors focus-within:outline-none",
      base: "w-full box-border border-0 p-0 m-0 bg-transparent text-neutral-900 focus:outline-none disabled:cursor-not-allowed disabled:text-neutral-400 resize-none leading-normal min-h-5",
      placeholder: "text-neutral-400",
      leading:
        "absolute start-0 top-0 flex items-center justify-center pointer-events-none text-neutral-400",
      leadingIcon: "shrink-0",
      trailing:
        "absolute end-0 top-0 flex items-center justify-center text-neutral-400",
      trailingIcon: "shrink-0",
      clear:
        "cursor-pointer pointer-events-auto transition-colors hover:text-neutral-700",
      count:
        "absolute end-0 bottom-0 flex items-center text-neutral-400 pointer-events-none tabular-nums",
    },
    variants: {
      color: createColorVariants(colors),
      variant: {
        outline: {
          root: "bg-white text-neutral-900 border-neutral-300",
        },
        soft: {
          root: "bg-neutral-100/70 text-neutral-900 border-transparent",
        },
        subtle: {
          root: "bg-neutral-100 text-neutral-900 border-neutral-300",
        },
        ghost: {
          root: "bg-transparent text-neutral-900 border-transparent",
        },
        none: {
          root: "bg-transparent text-neutral-900 border-0",
        },
      },
      size: {
        xs: {
          root: "text-xs p-2 min-h-16",
          base: "text-xs min-h-4",
          placeholder: "text-xs",
          leading: "ps-2 pt-2",
          trailing: "pe-2 pt-2",
          count: "pe-2 pb-1.5 text-xs",
          leadingIcon: "w-3.5 h-3.5",
          trailingIcon: "w-3.5 h-3.5",
          clear: "text-xs",
        },
        sm: {
          root: "text-xs p-2.5 min-h-20",
          base: "text-xs min-h-4",
          placeholder: "text-xs",
          leading: "ps-2.5 pt-2.5",
          trailing: "pe-2.5 pt-2.5",
          count: "pe-2.5 pb-2 text-xs",
          leadingIcon: "w-4 h-4",
          trailingIcon: "w-4 h-4",
          clear: "text-xs",
        },
        md: {
          root: "text-sm p-3 min-h-24",
          base: "text-sm min-h-5",
          placeholder: "text-sm",
          leading: "ps-3 pt-3",
          trailing: "pe-3 pt-3",
          count: "pe-3 pb-2 text-xs",
          leadingIcon: "w-4 h-4",
          trailingIcon: "w-4 h-4",
          clear: "text-sm",
        },
        lg: {
          root: "text-base p-3.5 min-h-28",
          base: "text-base min-h-6",
          placeholder: "text-base",
          leading: "ps-3.5 pt-3.5",
          trailing: "pe-3.5 pt-3.5",
          count: "pe-3.5 pb-2.5 text-sm",
          leadingIcon: "w-5 h-5",
          trailingIcon: "w-5 h-5",
          clear: "text-base",
        },
        xl: {
          root: "text-lg p-4 min-h-32",
          base: "text-lg min-h-7",
          placeholder: "text-lg",
          leading: "ps-4 pt-4",
          trailing: "pe-4 pt-4",
          count: "pe-4 pb-3 text-sm",
          leadingIcon: "w-5 h-5",
          trailingIcon: "w-5 h-5",
          clear: "text-base",
        },
      },
      leading: {
        true: {
          root: "",
        },
        false: {
          root: "",
        },
      },
      trailing: {
        true: {
          root: "",
        },
        false: {
          root: "",
        },
      },
      count: {
        true: {
          root: "",
        },
        false: {
          root: "",
        },
      },
      highlight: {
        true: {
          root: "",
        },
        false: {
          root: "",
        },
      },
      disabled: {
        true: {
          root: "opacity-60 cursor-not-allowed bg-neutral-100",
          base: "cursor-not-allowed text-neutral-400",
        },
        false: {
          root: "",
          base: "",
        },
      },
      invalid: {
        true: {
          root: "",
        },
        false: {
          root: "",
        },
      },
      autoHeight: {
        true: {
          root: "min-h-0",
          base: "h-auto",
        },
        false: {
          base: "h-full min-h-[4.5rem]",
        },
      },
    },
    compoundVariants: [
      {
        leading: true,
        size: "xs",
        class: {
          base: "ps-5",
        },
      },
      {
        leading: true,
        size: "sm",
        class: {
          base: "ps-6",
        },
      },
      {
        leading: true,
        size: "md",
        class: {
          base: "ps-7",
        },
      },
      {
        leading: true,
        size: "lg",
        class: {
          base: "ps-8",
        },
      },
      {
        leading: true,
        size: "xl",
        class: {
          base: "ps-9",
        },
      },
      {
        trailing: true,
        size: "xs",
        class: {
          base: "pe-5",
        },
      },
      {
        trailing: true,
        size: "sm",
        class: {
          base: "pe-6",
        },
      },
      {
        trailing: true,
        size: "md",
        class: {
          base: "pe-7",
        },
      },
      {
        trailing: true,
        size: "lg",
        class: {
          base: "pe-8",
        },
      },
      {
        trailing: true,
        size: "xl",
        class: {
          base: "pe-9",
        },
      },
      {
        count: true,
        size: "xs",
        class: {
          root: "pb-6",
        },
      },
      {
        count: true,
        size: "sm",
        class: {
          root: "pb-6",
        },
      },
      {
        count: true,
        size: "md",
        class: {
          root: "pb-7",
        },
      },
      {
        count: true,
        size: "lg",
        class: {
          root: "pb-8",
        },
      },
      {
        count: true,
        size: "xl",
        class: {
          root: "pb-9",
        },
      },
      ...(colors as readonly string[]).flatMap((color) => [
        {
          color: color as (typeof colors)[number],
          variant: ["outline", "subtle", "soft"] as any,
          class: {
            root: `focus-within:border-${color} focus-within:ring-2 focus-within:ring-${color}/20 data-[state=focused]:border-${color} data-[state=focused]:ring-2 data-[state=focused]:ring-${color}/20 data-[focused=true]:border-${color} data-[focused=true]:ring-2 data-[focused=true]:ring-${color}/20`,
          },
        },
        {
          color: color as (typeof colors)[number],
          highlight: true as const,
          class: {
            root: `border-${color} ring-2 ring-${color}/20`,
          },
        },
      ]),
      {
        invalid: true as const,
        class: {
          root: `border-${errorColor} ring-2 ring-${errorColor}/20 focus-within:border-${errorColor} focus-within:ring-2 focus-within:ring-${errorColor}/20 data-[state=focused]:border-${errorColor} data-[state=focused]:ring-2 data-[state=focused]:ring-${errorColor}/20 data-[focused=true]:border-${errorColor} data-[focused=true]:ring-2 data-[focused=true]:ring-${errorColor}/20`,
        },
      },
    ],
    defaultVariants: {
      variant: "outline",
      color: "primary",
      size: "md",
      leading: false,
      trailing: false,
      count: false,
      highlight: false,
      disabled: false,
      invalid: false,
      autoHeight: false,
    },
  });
}
