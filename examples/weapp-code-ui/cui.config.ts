import { defineConfig } from "@code-ui/plugin-vite";

export default defineConfig({
  prefix: "cui",
  icons: {
    collections: ["lucide", "tabler"],
    loading: "i-lucide-loader",
    check: "i-lucide-check",
    close: "i-lucide-x",
    minus: "i-lucide-minus",
    chevronDown: "i-lucide-chevron-down",
    upload: "i-lucide-upload",
    file: "i-lucide-file-text",
    image: "i-lucide-image",
    video: "i-lucide-video",
    audio: "i-lucide-music",
  },
  ui: {
    colors: {
      primary: "stone",
      secondary: "amber",
      danger: "red",
    },
    colorMode: "light",
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
