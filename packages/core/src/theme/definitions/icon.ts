import {
  DEFAULT_THEME_COLORS,
  defineTheme,
  type ThemeOptions,
} from "../../theme";

export default function iconTheme(options: ThemeOptions = {}) {
  const colors = (options.colors ?? DEFAULT_THEME_COLORS) as readonly string[];

  return defineTheme({
    slots: {
      root: "shrink-0 size-[1em]",
    },
    variants: {
      size: {
        xs: { root: "size-3.5" },
        sm: { root: "size-4" },
        md: { root: "size-5" },
        lg: { root: "size-6" },
        xl: { root: "size-7" },
      },
      color: Object.assign(
        Object.fromEntries(
          colors.map((color) => [color, { root: `text-${color}` }]),
        ),
        { neutral: { root: "text-neutral" } },
      ),
      spin: {
        true: { root: "animate-spin" },
      },
    },
  });
}
