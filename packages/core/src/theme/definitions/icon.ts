import { defineTheme, type ThemeOptions } from "../../theme";

export default function iconTheme(_options: ThemeOptions = {}) {
  return defineTheme({
    slots: {
      root: "shrink-0 size-[1em]",
    },
    variants: {},
  });
}
