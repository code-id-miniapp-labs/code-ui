import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
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
      if (existsSync("src/wxs")) {
        mkdirSync("dist/wxs", { recursive: true });
        for (const file of readdirSync("src/wxs")) {
          copyFileSync(join("src/wxs", file), join("dist/wxs", file));
        }
      }
      const utilsDomWxs = resolve(process.cwd(), "../../utils/src/wxs/dom.wxs");
      if (existsSync(utilsDomWxs)) {
        mkdirSync("dist/wxs", { recursive: true });
        copyFileSync(utilsDomWxs, "dist/wxs/dom.wxs");
      }
    },
  },
});
