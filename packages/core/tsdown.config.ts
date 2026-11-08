import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/icons.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  target: "es2020",
  fixedExtension: false,
});
