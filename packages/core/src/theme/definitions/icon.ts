import { defineTheme, type ThemeOptions } from "../../theme";

/**
 * Icon theme (Nuxt UI `UIcon` style).
 *
 * Intentionally variant-free: size, color and animation are plain utility
 * classes passed via `class`, e.g. `<c-icon name="i-lucide-loader-circle"
 * class="size-5 text-primary animate-spin" />`.
 *
 * Defaults to `1em` so icons scale with the surrounding font size, and
 * inherit `currentColor` from the parent text color.
 */
export default function iconTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "shrink-0 size-[1em]",
    },
    variants: {},
  });
}
