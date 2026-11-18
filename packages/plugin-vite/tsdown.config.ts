import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/icons.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  target: "node18",
  fixedExtension: false,
  outputOptions: {
    exports: "named",
  },
  deps: {
    neverBundle: [
      "vite",
      "c12",
      "@egoist/tailwindcss-icons",
      "@iconify-json/lucide",
    ],
    alwaysBundle: ["@code-ui/core", "@code-ui/compiler", "@code-ui/utils"],
  },
});
