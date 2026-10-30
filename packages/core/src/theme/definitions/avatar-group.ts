import { defineTheme, type ThemeOptions } from "../../theme";

export default function avatarGroupTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "inline-flex flex-row-reverse justify-end items-center",
      base: "relative rounded-full ring-bg ring-2 first:me-0",
      counter: "font-semibold tracking-tight",
    },
    variants: {
      size: {
        "3xs": {
          base: "ring -me-0.5",
          counter: "text-[14rpx] ps-0.5",
        },
        "2xs": {
          base: "ring -me-0.5",
          counter: "text-[16rpx] ps-0.5",
        },
        xs: {
          base: "ring -me-0.5",
          counter: "text-[18rpx] ps-0.5",
        },
        sm: {
          base: "ring-2 -me-1",
          counter: "text-[20rpx] ps-0.5",
        },
        md: {
          base: "ring-2 -me-1.5",
          counter: "text-xs ps-1",
        },
        lg: {
          base: "ring-2 -me-1.5",
          counter: "text-xs ps-1",
        },
        xl: {
          base: "ring-3 -me-2",
          counter: "text-sm ps-1.5",
        },
        "2xl": {
          base: "ring-3 -me-2",
          counter: "text-base ps-1.5",
        },
        "3xl": {
          base: "ring-3 -me-2",
          counter: "text-lg ps-1.5",
        },
      },
    },
    defaultVariants: {
      size: "md",
    },
  });
}
