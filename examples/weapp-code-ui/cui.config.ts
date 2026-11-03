import { defineConfig } from "@code-ui/plugin-vite";

export default defineConfig({
  prefix: "cui",
  icons: {
    collections: ["lucide", "tabler"],
    loading: "i-lucide-loader",
    check: "i-lucide-check",
    close: "i-lucide-close",
    minus: "i-lucide-minus",
    chevronDown: "i-lucide-chevron-down",
  },
  ui: {
    colors: {
      primary: "stone",
      secondary: "amber",
      danger: "red",
    },
  },
  components: {
    button: {
      slots: {},
    },
    drawer: {
      slots: {
        content: "shadow-2xl",
      },
    },
  },
});
