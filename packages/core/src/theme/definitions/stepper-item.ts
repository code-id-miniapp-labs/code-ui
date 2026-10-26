import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

function createStepperColorVariants<const C extends readonly string[]>(
  colors: C,
) {
  const result: Record<string, Record<string, string>> = {};
  for (const color of colors) {
    if (color === "neutral") {
      result[color] = {
        trigger:
          "group-data-[state=completed]:bg-neutral-900 group-data-[state=current]:bg-neutral-900 group-data-[state=active]:bg-neutral-900 group-data-[state=completed]:text-white group-data-[state=current]:text-white group-data-[state=active]:text-white outline-neutral-900/25",
        title:
          "group-data-[state=current]:text-neutral-900 group-data-[state=active]:text-neutral-900",
        separator: "group-data-[state=completed]:bg-neutral-900",
      };
    } else {
      result[color] = {
        trigger: `group-data-[state=completed]:bg-${color}-500 group-data-[state=current]:bg-${color}-500 group-data-[state=active]:bg-${color}-500 group-data-[state=completed]:text-white group-data-[state=current]:text-white group-data-[state=active]:text-white outline-${color}-500/25`,
        title: `group-data-[state=current]:text-${color}-600 group-data-[state=active]:text-${color}-600`,
        separator: `group-data-[state=completed]:bg-${color}-500`,
      };
    }
  }
  return result as Record<C[number], Record<string, string>>;
}

export default function stepperItemTheme(options: ThemeOptions = {}) {
  const colors = options.colors ?? DEFAULT_THEME_COLORS;

  return defineTheme({
    slots: {
      root: "group relative flex min-w-0",
      container: "relative flex shrink-0",
      trigger:
        "rounded-full text-center align-middle flex items-center justify-center font-semibold group-data-[state=completed]:text-white group-data-[state=current]:text-white group-data-[state=active]:text-white text-neutral-400 bg-neutral-100 transition-colors cursor-pointer select-none focus:outline-none",
      indicator: "flex items-center justify-center size-full",
      icon: "shrink-0 leading-none",
      separator:
        "absolute rounded-full group-data-[disabled]:opacity-75 bg-neutral-200 transition-colors pointer-events-none",
      wrapper: "flex flex-col min-w-0 cursor-pointer select-none",
      title:
        "block font-medium text-neutral-500 group-data-[state=completed]:text-neutral-900 transition-colors truncate max-w-full w-full",
      description:
        "block text-neutral-400 transition-colors truncate max-w-full w-full mt-0.5",
    },
    variants: {
      orientation: {
        horizontal: {
          root: "flex-col items-center flex-1 min-w-16 shrink-0",
          container: "justify-center w-full",
          separator: "top-[calc(50%-2rpx)] h-[4rpx]",
          wrapper: "items-center text-center mt-2 w-full px-0.5",
          title: "text-center",
          description: "text-center",
        },
        vertical: {
          root: "flex-row items-start gap-3 w-full text-start pb-6 last:pb-0",
          container: "flex-col items-center self-stretch",
          trigger: "shrink-0",
          separator: "start-[calc(50%-2rpx)] bottom-[8rpx] w-[4rpx] min-h-4",
          wrapper: "items-start text-left flex-1 mt-0",
          title: "text-left whitespace-normal",
          description: "text-left whitespace-normal",
        },
      },
      size: {
        xs: {
          trigger: "size-5 text-[20rpx]",
          icon: "size-2.5",
          title: "text-[20rpx]",
          description: "text-[18rpx]",
          wrapper: "mt-1",
        },
        sm: {
          trigger: "size-6 text-xs",
          icon: "size-3",
          title: "text-xs",
          description: "text-[20rpx]",
          wrapper: "mt-1.5",
        },
        md: {
          trigger: "size-7 text-xs",
          icon: "size-3.5",
          title: "text-xs font-semibold",
          description: "text-[22rpx]",
          wrapper: "mt-2",
        },
        lg: {
          trigger: "size-8 text-sm",
          icon: "size-4",
          title: "text-sm font-semibold",
          description: "text-xs",
          wrapper: "mt-2.5",
        },
        xl: {
          trigger: "size-10 text-base",
          icon: "size-5",
          title: "text-base font-semibold",
          description: "text-sm",
          wrapper: "mt-3",
        },
      },
      color: createStepperColorVariants(colors),
      disabled: {
        true: {
          root: "opacity-50 pointer-events-none cursor-not-allowed",
          trigger: "cursor-not-allowed",
        },
        false: {},
      },
    },
    compoundVariants: [
      {
        orientation: "horizontal",
        size: "xs",
        class: { separator: "start-[calc(50%+28rpx)] end-[calc(-50%+28rpx)]" },
      },
      {
        orientation: "horizontal",
        size: "sm",
        class: { separator: "start-[calc(50%+32rpx)] end-[calc(-50%+32rpx)]" },
      },
      {
        orientation: "horizontal",
        size: "md",
        class: { separator: "start-[calc(50%+40rpx)] end-[calc(-50%+40rpx)]" },
      },
      {
        orientation: "horizontal",
        size: "lg",
        class: { separator: "start-[calc(50%+44rpx)] end-[calc(-50%+44rpx)]" },
      },
      {
        orientation: "horizontal",
        size: "xl",
        class: { separator: "start-[calc(50%+56rpx)] end-[calc(-50%+56rpx)]" },
      },
      {
        orientation: "vertical",
        size: "xs",
        class: { separator: "top-[48rpx]" },
      },
      {
        orientation: "vertical",
        size: "sm",
        class: { separator: "top-[56rpx]" },
      },
      {
        orientation: "vertical",
        size: "md",
        class: { separator: "top-[64rpx]" },
      },
      {
        orientation: "vertical",
        size: "lg",
        class: { separator: "top-[74rpx]" },
      },
      {
        orientation: "vertical",
        size: "xl",
        class: { separator: "top-[92rpx]" },
      },
    ],
    defaultVariants: {
      orientation: "horizontal",
      color: "primary",
      size: "md",
      disabled: false,
    },
  });
}
