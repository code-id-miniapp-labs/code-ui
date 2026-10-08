import { tv } from "tailwind-variants/lite";

export const buttonTheme = tv({
  slots: {
    root: "relative inline-flex items-center justify-center font-medium transition-all select-none overflow-hidden active:opacity-80",
    label: "truncate",
    icon: "flex items-center justify-center shrink-0",
    spinner: "flex items-center justify-center shrink-0",
  },
  variants: {
    variant: {
      solid: {
        root: "shadow-sm",
      },
      outline: {
        root: "border bg-transparent",
      },
      ghost: {
        root: "bg-transparent",
      },
      secondary: {
        root: "bg-neutral-100 text-neutral-800 active:bg-neutral-200",
      },
    },
    color: {
      primary: {},
      neutral: {},
      danger: {},
      success: {},
    },
    size: {
      sm: {
        root: "h-7 px-2.5 text-xs rounded-md gap-1",
        icon: "w-3.5 h-3.5",
        spinner: "w-3.5 h-3.5",
      },
      md: {
        root: "h-9 px-3.5 text-sm rounded-lg gap-1.5",
        icon: "w-4 h-4",
        spinner: "w-4 h-4",
      },
      lg: {
        root: "h-11 px-4.5 text-base rounded-xl gap-2",
        icon: "w-5 h-5",
        spinner: "w-5 h-5",
      },
    },
    block: {
      true: {
        root: "w-full flex",
      },
    },
    disabled: {
      true: {
        root: "opacity-50 cursor-not-allowed",
      },
    },
    loading: {
      true: {
        root: "",
      },
    },
  },
  compoundVariants: [
    // solid
    {
      variant: "solid",
      color: "primary",
      class: {
        root: "bg-emerald-600 text-white active:bg-emerald-700",
      },
    },
    {
      variant: "solid",
      color: "danger",
      class: {
        root: "bg-rose-600 text-white active:bg-rose-700",
      },
    },
    {
      variant: "solid",
      color: "neutral",
      class: {
        root: "bg-neutral-900 text-white active:bg-neutral-800",
      },
    },
    // outline
    {
      variant: "outline",
      color: "primary",
      class: {
        root: "border border-emerald-600 text-emerald-600 active:bg-emerald-50",
      },
    },
    {
      variant: "outline",
      color: "danger",
      class: {
        root: "border border-rose-600 text-rose-600 active:bg-rose-50",
      },
    },
    {
      variant: "outline",
      color: "neutral",
      class: {
        root: "border border-neutral-300 text-neutral-700 active:bg-neutral-100",
      },
    },
    // ghost
    {
      variant: "ghost",
      color: "primary",
      class: {
        root: "text-emerald-600 active:bg-emerald-50",
      },
    },
    {
      variant: "ghost",
      color: "danger",
      class: {
        root: "text-rose-600 active:bg-rose-50",
      },
    },
    {
      variant: "ghost",
      color: "neutral",
      class: {
        root: "text-neutral-700 active:bg-neutral-100",
      },
    },
  ],
  defaultVariants: {
    variant: "solid",
    color: "primary",
    size: "md",
  },
});

export type ButtonSlots = keyof typeof buttonTheme.slots;
