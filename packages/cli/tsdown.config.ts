import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  target: "node18",
  fixedExtension: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
