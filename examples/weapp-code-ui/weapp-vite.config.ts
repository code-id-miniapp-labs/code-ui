import { defineConfig } from "weapp-vite";
import { codeUI } from "@code-ui/plugin-vite";

export default defineConfig(({ mode }) => {
  console.log("[mode]:", mode);
  return {
    weapp: {
      tailwindcss: {
        rem2rpx: true,
      },
      hmr: {
        runtime: "classic",
      },
      srcRoot: "src",
      platform: "weapp",
      buildScope: ["wechat"],
      web: {
        pluginOptions: {
          runtime: {
            routing: {
              mode: "history",
            },
          },
        },
      },
      generate: {
        extensions: {
          js: "ts",
          wxss: "scss",
        },
        dirs: {
          component: "src/components",
          page: "src/pages",
        },
      },
    },
    plugins: [
      codeUI({
        autoImport: true,
        treeShake: mode === "production",
      }),
    ],
  };
});
