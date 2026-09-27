import { defineConfig } from "@code-ui/plugin-vite";

export default defineConfig({
  prefix: "cui",
  ui: {
    colors: {
      primary: "#10b981",
      neutral: "#737373",
      danger: "#ef4444",
    },
    radius: {
      md: "12rpx",
      lg: "16rpx",
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
