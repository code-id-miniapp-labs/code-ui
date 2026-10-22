import { defineTheme, type ThemeOptions } from "../../theme";

export default function avatarTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "relative overflow-hidden inline-flex items-center justify-center shrink-0 select-none rounded-full align-middle",
      image: "absolute inset-0 h-full w-full rounded-full object-cover block",
      fallback: "font-medium truncate text-sm",
      icon: "shrink-0",
    },
    variants: {
      color: {
        primary: {
          root: "bg-primary/10",
          fallback: "text-primary",
          icon: "text-primary",
        },
        secondary: {
          root: "bg-secondary/10",
          fallback: "text-secondary",
          icon: "text-secondary",
        },
        success: {
          root: "bg-success/10",
          fallback: "text-success",
          icon: "text-success",
        },
        info: {
          root: "bg-info/10",
          fallback: "text-info",
          icon: "text-info",
        },
        warning: {
          root: "bg-warning/10",
          fallback: "text-warning",
          icon: "text-warning",
        },
        danger: {
          root: "bg-danger/10",
          fallback: "text-danger",
          icon: "text-danger",
        },
        neutral: {
          root: "bg-elevated",
          fallback: "text-muted",
          icon: "text-muted",
        },
      },
      size: {
        "3xs": {
          root: "size-4",
          fallback: "text-[8rpx]",
        },
        "2xs": {
          root: "size-5",
          fallback: "text-[10rpx]",
        },
        xs: {
          root: "size-6",
          fallback: "text-xs",
        },
        sm: {
          root: "size-7",
          fallback: "text-xs",
        },
        md: {
          root: "size-8",
          fallback: "text-sm",
        },
        lg: {
          root: "size-9",
          fallback: "text-md",
        },
        xl: {
          root: "size-10",
          fallback: "text-lg",
        },
        "2xl": {
          root: "size-11",
          fallback: "text-xl",
        },
        "3xl": {
          root: "size-12",
          fallback: "text-2xl",
        },
      },
    },
    defaultVariants: {
      size: "md",
      color: "neutral",
    },
  });
}
