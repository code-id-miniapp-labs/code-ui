import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function selectTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative w-full",
      base: "relative w-full min-h-0 flex items-center justify-between overflow-hidden box-border rounded-lg border text-highlighted transition-colors cursor-pointer select-none focus:outline-none",
      leading: "shrink-0 flex items-center justify-center text-dimmed",
      leadingIcon: "inline-flex items-center justify-center shrink-0 leading-none",
      value: "flex-1 min-w-0 truncate text-left text-inherit",
      placeholder: "flex-1 min-w-0 truncate text-left text-dimmed",
      trailing: "shrink-0 flex items-center justify-center gap-1 text-dimmed",
      trailingIcon:
        "inline-flex items-center justify-center shrink-0 leading-none transition-transform duration-200",
      iconInner: "w-full h-full block",
      loadingIcon: "w-full h-full block animate-spin",
      content: "",
      viewport: "w-full p-1 box-border",
      header: "px-2.5 py-2 border-b border-muted",
      footer: "px-2.5 py-2 border-t border-muted",
      empty: "py-6 px-3 text-center text-sm text-muted",
      pickerRoot:
        "fixed inset-0 z-50 flex items-end justify-center overflow-hidden overscroll-contain box-border",
      pickerBackdrop:
        "fixed inset-0 bg-black/40 transition-opacity duration-250",
      pickerContent:
        "relative z-10 flex flex-col w-full bg-default rounded-t-2xl shadow-2xl transition-transform duration-250 ease-out box-border overflow-hidden pb-[env(safe-area-inset-bottom)]",
      pickerHeader:
        "flex items-center justify-between px-4 py-3 border-b border-muted shrink-0 box-border w-full",
      pickerCancel:
        "text-sm text-muted px-1 py-0.5 cursor-pointer select-none active:opacity-70",
      pickerTitle:
        "flex-1 min-w-0 text-center text-base font-semibold text-highlighted truncate px-2",
      pickerConfirm:
        "text-sm font-semibold px-1 py-0.5 cursor-pointer select-none active:opacity-70",
      pickerBody: "w-full bg-default box-border overflow-hidden",
      pickerView: "w-full",
      pickerColumn: "",
      pickerItem:
        "flex items-center justify-center text-sm text-highlighted truncate px-3 text-center",
      pickerItemDisabled:
        "flex items-center justify-center text-sm text-dimmed opacity-40 truncate px-3 text-center",
      pickerFooter: "px-4 py-3 border-t border-muted shrink-0 box-border w-full",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(
          colors.map((color) => [
            color,
            {
              pickerConfirm: `text-${color}`,
            },
          ]),
        ),
        {
          neutral: {
            pickerConfirm: "text-highlighted",
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
          base: "bg-transparent text-highlighted border-transparent",
        },
        none: {
          base: "bg-transparent text-highlighted border-0",
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
      open: {
        true: {
          trailingIcon: "rotate-180",
          pickerBackdrop: "opacity-100 pointer-events-auto",
          pickerContent: "translate-y-0",
        },
        false: {
          pickerBackdrop: "opacity-0 pointer-events-none",
          pickerContent: "translate-y-full",
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
          base: "cursor-not-allowed bg-elevated text-dimmed pointer-events-none",
        },
        false: {},
      },
      invalid: {
        true: { base: "" },
        false: {},
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
      ...colors.map((color) => ({
        color,
        open: true as const,
        class: {
          base: `border-${color} ring-2 ring-${color}/20`,
        },
      })),
      {
        color: "neutral" as const,
        open: true as const,
        class: {
          base: "border-inverted ring-2 ring-inverted/20",
        },
      },
      {
        variant: "ghost" as const,
        open: true as const,
        class: {
          base: "border-transparent ring-0",
        },
      },
      {
        variant: "none" as const,
        open: true as const,
        class: {
          base: "border-0 ring-0",
        },
      },
      {
        invalid: true as const,
        class: {
          base: `border-${errorColor} ring-2 ring-${errorColor}/20`,
        },
      },
    ],
    defaultVariants: {
      variant: "outline",
      color: "primary",
      size: "md",
      open: false,
      leading: false,
      trailing: true,
      highlight: false,
      disabled: false,
      invalid: false,
    },
  });
}
