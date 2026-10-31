import { defineTheme, type ThemeOptions } from "../../theme";

export default function accordionItemTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "w-full text-sm group",
      header: "flex",
      trigger:
        "flex w-full items-center justify-between py-3.5 px-4 text-start font-medium text-neutral-900 select-none focus:outline-none transition-colors",
      leading: "flex items-center shrink-0 me-2.5",
      leadingIcon: "size-4 shrink-0 text-neutral-500",
      label: "flex-1 font-medium text-neutral-900 truncate",
      description: "text-xs text-neutral-500 mt-0.5 truncate",
      trailing:
        "flex items-center shrink-0 ms-2.5 transition-transform duration-200 group-data-[state=open]:rotate-180",
      trailingIcon: "size-4 shrink-0 text-neutral-400",
      content:
        "overflow-hidden text-neutral-600 transition-[height,opacity] duration-200 ease-out will-change-[height,opacity]",
      body: "box-border px-4 pb-3.5 pt-0 text-neutral-600 leading-relaxed overflow-hidden min-h-0",
    },
    variants: {
      size: {
        sm: {
          trigger: "py-2.5 px-3 text-xs",
          leadingIcon: "size-3.5",
          label: "text-xs",
          description: "text-[20rpx]",
          trailingIcon: "size-3.5",
          body: "px-3 pb-2.5 text-xs",
        },
        md: {
          trigger: "py-3.5 px-4 text-sm",
          leadingIcon: "size-4",
          label: "text-sm",
          description: "text-xs",
          trailingIcon: "size-4",
          body: "px-4 pb-3.5 text-sm",
        },
        lg: {
          trigger: "py-4 px-5 text-base",
          leadingIcon: "size-5",
          label: "text-base",
          description: "text-xs",
          trailingIcon: "size-5",
          body: "px-5 pb-4 text-base",
        },
      },
      variant: {
        outline: {},
        subtle: {},
        soft: {},
        plain: {},
        separated: {
          root: "border border-neutral-200 rounded-lg shadow-2xs bg-white overflow-hidden",
        },
      },
      disabled: {
        true: {
          root: "opacity-50 pointer-events-none cursor-not-allowed",
          trigger: "cursor-not-allowed",
        },
        false: {},
      },
    },
    defaultVariants: {
      size: "md",
      variant: "outline",
      disabled: false,
    },
  });
}

