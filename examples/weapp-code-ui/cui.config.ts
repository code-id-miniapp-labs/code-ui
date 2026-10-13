import { defineConfig } from "@code-ui/plugin-vite";

export default defineConfig({
  prefix: "cui",
  ui: {
    colors: {
      primary: "fuchsia",
      neutral: "amber",
      danger: "rose",
    },
  },
  components: {
    button: {
      slots: {
        root: "shadow-sm",
      },
    },
    drawer: {
      slots: {
        content: "shadow-2xl",
      },
    },
  },
});
