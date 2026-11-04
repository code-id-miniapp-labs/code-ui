import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
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
          if (!file.endsWith(".wxs")) continue;
          const source = readFileSync(join("src/wxs", file), "utf8");
          writeFileSync(
            join("dist/wxs", file),
            source.replace(
              /require\(\s*['"][^'"]*\/dom\.wxs['"]\s*\)/g,
              "require('./dom.wxs')",
            ),
          );
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
