import { defineConfig } from "@code-ui/plugin-vite";

export default defineConfig({
  prefix: "cui",
  icons: {
    collections: ["lucide", "tabler"],
  },
  ui: {
    colors: {
      primary: "gray",
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
