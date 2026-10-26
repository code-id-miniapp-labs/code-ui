import { defineTheme, type ThemeOptions } from "../../theme";

export default function stepperTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "w-full flex flex-col gap-4",
      header: "w-full flex",
      list: "w-full",
      content: "size-full mt-4",
    },
    variants: {
      orientation: {
        horizontal: {
          root: "flex-col",
          header: "flex-row items-start flex-nowrap w-full min-w-full px-2.5 py-1",
          list: "w-full overflow-x-auto scroll-px-2.5 py-1",
        },
        vertical: {
          root: "flex-col",
          header: "flex-col gap-4",
          list: "flex flex-col items-start w-full",
        },
      },
      disabled: {
        true: {
          root: "opacity-50 pointer-events-none",
        },
        false: {},
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      disabled: false,
    },
  });
}
