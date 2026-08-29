import { existsSync } from "node:fs";
import { cp } from "node:fs/promises";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2015",
  onSuccess: async () => {
    if (existsSync("src/wxs")) {
      await cp("src/wxs", "dist/wxs", { recursive: true });
    }
  },
});

