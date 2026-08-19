import { defineConfig } from "tsup";

export default defineConfig([
  // 1. Single shared entry point containing all runtime dependencies (alien-signals, machines, core, adapters)
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["cjs"],
    dts: true,
    sourcemap: false,
    clean: true,
    target: "es2017",
    noExternal: [/@code-ui\/.*/, "alien-signals"],
    outExtension() {
      return { js: ".js" };
    },
  },
  // 2. Ultra-lightweight MiniProgram component adapters (~1-2KB) that require() the single shared index.js
  {
    entry: {
      "button/index": "src/button/index.ts",
      "drawer/index": "src/drawer/index.ts",
    },
    format: ["cjs"],
    dts: true,
    sourcemap: false,
    clean: false,
    target: "es2017",
    external: ["../index", "../index.js", "../index.cjs"],
    outExtension() {
      return { js: ".js" };
    },
  },
]);
