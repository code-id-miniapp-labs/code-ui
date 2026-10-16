import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
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
    neverBundle: ["vite", "c12", "@code-ui/core"],
  },
});
