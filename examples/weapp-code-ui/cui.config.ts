import { defineConfig } from "@code-ui/plugin-vite";

export default defineConfig({
  prefix: "cui",
  ui: {
    colors: {
      primary: "blue",
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
