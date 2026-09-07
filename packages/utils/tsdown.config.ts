import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  target: "es2020",
  fixedExtension: false,
  hooks: {
    "build:done": () => {
      if (existsSync("src/wxs/dom.wxs")) {
        mkdirSync("dist/wxs", { recursive: true });
        copyFileSync("src/wxs/dom.wxs", "dist/wxs/dom.wxs");
      }
    },
  },
});
