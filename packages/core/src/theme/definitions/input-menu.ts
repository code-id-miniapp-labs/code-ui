import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function inputMenuTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];
  const errorColor = options.errorColor ?? "danger";

  return defineTheme({
    slots: {
      root: "relative w-full",
      base: "relative w-full min-h-0 flex items-center overflow-hidden box-border rounded-md border text-highlighted transition-colors focus:outline-none",
      leading: "shrink-0 flex items-center justify-center text-dimmed",
      leadingIcon:
        "inline-flex items-center justify-center shrink-0 leading-none",
      tagsWrapper: "flex-1 min-w-0 flex items-center gap-2",
      tagsItem:
        "inline-flex items-center gap-1 rounded bg-elevated text-highlighted font-medium max-w-full min-w-0 box-border",
      tagsItemIcon:
        "inline-flex items-center justify-center shrink-0 leading-none text-dimmed",
      tagsItemText: "truncate",
      tagsItemDelete:
        "inline-flex items-center justify-center shrink-0 rounded-xs text-dimmed cursor-pointer active:opacity-70",
      tagsItemDeleteIcon:
        "inline-flex items-center justify-center shrink-0 leading-none",
      nativeInput:
        "flex-1 min-w-0 w-full min-h-0 bg-transparent border-0 p-0 m-0 font-sans text-inherit leading-normal placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:text-dimmed",
      trailing: "shrink-0 flex items-center justify-center gap-1 text-dimmed",
      trailingIcon:
        "inline-flex items-center justify-center shrink-0 leading-none transition-transform duration-200",
      iconInner: "w-full h-full block",
      loadingIcon: "w-full h-full block animate-spin",
      content: "",
      viewport: "w-full p-1 flex flex-col gap-1 box-border",
      header: "px-2.5 py-2 border-b border-muted",
      footer: "px-2.5 py-2 border-t border-muted",
      empty: "py-6 px-3 text-center text-sm text-muted",
      createItem:
        "relative flex items-center w-full select-none cursor-pointer rounded-md transition-colors box-border text-highlighted active:bg-elevated",
      createItemIcon: "shrink-0 text-dimmed",
      createItemLabel: "flex-1 min-w-0 truncate font-medium text-highlighted",
    },
    variants: {
      color: Object.assign(
        Object.fromEntries(colors.map((color) => [color, {}])),
        { neutral: {} },
      ),
      variant: {
        outline: {
          base: "bg-default text-highlighted border-accented",
        },
        soft: {
          base: "bg-elevated text-highlighted border-transparent",
          tagsItem: "bg-default",
        },
        subtle: {
          base: "bg-elevated text-highlighted border-accented",
          tagsItem: "bg-default",
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
          tagsItem: "px-1.5 py-0.5 text-[10px]",
          tagsItemIcon: "size-3",
          tagsItemDeleteIcon: "size-3",
          createItem: "px-1.5 py-1 text-xs gap-1.5",
          createItemIcon: "size-3.5",
        },
        sm: {
          base: "h-8 text-xs px-2.5 gap-1.5",
          leadingIcon: "size-4",
          trailingIcon: "size-4",
          tagsItem: "px-1.5 py-0.5 text-xs",
          tagsItemIcon: "size-3.5",
          tagsItemDeleteIcon: "size-3.5",
          createItem: "px-2 py-1.5 text-xs gap-1.5",
          createItemIcon: "size-4",
        },
        md: {
          base: "h-9 text-sm px-3 gap-1.5",
          leadingIcon: "size-4",
          trailingIcon: "size-4",
          tagsItem: "px-2 py-0.5 text-xs",
          tagsItemIcon: "size-3.5",
          tagsItemDeleteIcon: "size-3.5",
          createItem: "px-2.5 py-1.5 text-sm gap-2",
          createItemIcon: "size-4",
        },
        lg: {
          base: "h-10 text-base px-3.5 gap-2",
          leadingIcon: "size-5",
          trailingIcon: "size-5",
          tagsItem: "px-2 py-1 text-xs",
          tagsItemIcon: "size-4",
          tagsItemDeleteIcon: "size-4",
          createItem: "px-3 py-2 text-base gap-2",
          createItemIcon: "size-5",
        },
        xl: {
          base: "h-11 text-lg px-4 gap-2",
          leadingIcon: "size-5",
          trailingIcon: "size-5",
          tagsItem: "px-2.5 py-1 text-sm",
          tagsItemIcon: "size-4",
          tagsItemDeleteIcon: "size-4",
          createItem: "px-3.5 py-2.5 text-lg gap-2.5",
          createItemIcon: "size-5",
        },
      },
      multiple: {
        // Grow with wrapped tags: `h-auto` replaces the fixed `h-*` from `size`,
        // while compound `min-h-*` below keeps the empty state at input height.
        true: {
          base: "h-auto py-1",
          tagsWrapper: "flex-wrap gap-y-1",
          nativeInput: "min-w-[60px] h-6",
        },
        false: {},
      },
      open: {
        true: {
          root: "z-50",
          trailingIcon: "rotate-180",
        },
        false: {},
      },
      focused: {
        true: {},
        false: {},
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
      ...colors.map((color) => ({
        color,
        focused: true as const,
        class: {
          base: `border-${color} ring-2 ring-${color}/20`,
        },
      })),
      {
        color: "neutral" as const,
        focused: true as const,
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
        variant: "ghost" as const,
        focused: true as const,
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
        variant: "none" as const,
        focused: true as const,
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
      ...(
        [
          ["xs", "min-h-7"],
          ["sm", "min-h-8"],
          ["md", "min-h-9"],
          ["lg", "min-h-10"],
          ["xl", "min-h-11"],
        ] as const
      ).map(([size, minHeight]) => ({
        multiple: true as const,
        size,
        class: {
          base: minHeight,
        },
      })),
    ],
    defaultVariants: {
      variant: "outline",
      color: "primary",
      size: "md",
      multiple: false,
      open: false,
      focused: false,
      leading: false,
      trailing: true,
      highlight: false,
      disabled: false,
      invalid: false,
    },
  });
}
