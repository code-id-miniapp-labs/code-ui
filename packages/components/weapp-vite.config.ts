import { defineConfig } from "weapp-vite";
import { cleanDistPlugin } from "./build/plugins/clean-dist";
import { syncWxsPlugin } from "./build/plugins/sync-wxs";
import { virtualThemePlugin } from "./build/plugins/virtual-theme";
import { wxmlTransformPlugin } from "./build/plugins/wxml-transform";
import { createCodeSplittingGroups } from "./build/utils/code-splitting";

export default defineConfig({
  plugins: [
    virtualThemePlugin(),
    wxmlTransformPlugin(),
    cleanDistPlugin(),
    syncWxsPlugin(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: true,
    cssMinify: "lightningcss",
    sourcemap: false,
    rolldownOptions: {
      preserveEntrySignatures: "allow-extension",
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
      output: {
        codeSplitting: {
          groups: createCodeSplittingGroups(),
        },
      },
    },
  },
  weapp: {
    srcRoot: "src",
    tailwindcss: false,
    generate: {
      extensions: {
        js: "ts",
        wxss: "wxss",
      },
    },
  },
});
