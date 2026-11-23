import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
    {
      name: "code-ui:emit-computed-entry",
      buildStart() {
        this.emitFile({
          type: "chunk",
          id: resolve(import.meta.dirname, "src/computed.ts"),
          fileName: "computed.js",
        });
        this.emitFile({
          type: "chunk",
          id: resolve(import.meta.dirname, "src/utils/presence.ts"),
          fileName: "behaviors/presence.js",
        });
      },
      generateBundle() {
        const dtsPath = resolve(
          import.meta.dirname,
          "../frameworks/miniapp/dist/behaviors/computed-behavior.d.ts",
        );
        this.emitFile({
          type: "asset",
          fileName: "computed.d.ts",
          source: readFileSync(dtsPath, "utf8"),
        });
        const presenceDtsPath = resolve(
          import.meta.dirname,
          "../frameworks/miniapp/dist/behaviors/presence.d.ts",
        );
        this.emitFile({
          type: "asset",
          fileName: "behaviors/presence.d.ts",
          source: readFileSync(presenceDtsPath, "utf8"),
        });
      },
    },
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
