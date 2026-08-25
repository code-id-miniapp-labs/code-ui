import { defineConfig } from "tsup";

export default defineConfig([
  // 1. Root package entry (for JS / TS npm imports)
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: false,
    clean: true,
    minify: true,
    treeshake: true,
    target: "es2015",
    noExternal: [/@code-ui\/.*/, "alien-signals"],
    esbuildOptions(options) {
      options.pure = ["console.log", "console.warn"];
      options.legalComments = "none";
    },
    outExtension({ format }) {
      if (format === "esm") {
        return { js: ".mjs" };
      }
      return { js: ".js" };
    },
  },

  // 2. Shared core runtime chunk (core FSM + miniapp + signals + utils, bundled once)
  {
    entry: {
      "_shared/runtime": "src/_shared/runtime.ts",
    },
    format: ["cjs"],
    dts: true,
    sourcemap: false,
    clean: false,
    minify: true,
    treeshake: true,
    target: "es2015",
    noExternal: [/@code-ui\/.*/, "alien-signals"],
    esbuildOptions(options) {
      options.pure = ["console.log", "console.warn"];
      options.legalComments = "none";
    },
    outExtension() {
      return { js: ".js" };
    },
  },

  // 3. Lightweight component adapters (bundles only its own machine, requires ../_shared/runtime)
  {
    entry: {
      "button/index": "src/button/index.ts",
      "drawer/index": "src/drawer/index.ts",
    },
    format: ["cjs"],
    dts: true,
    sourcemap: false,
    clean: false,
    minify: true,
    treeshake: true,
    target: "es2015",
    external: ["../_shared/runtime", "../_shared/runtime.js", "../_shared/runtime.cjs"],
    noExternal: [/@code-ui\/.*/, "alien-signals"],
    esbuildOptions(options) {
      options.pure = ["console.log", "console.warn"];
      options.legalComments = "none";
    },
    outExtension() {
      return { js: ".js" };
    },
  },
]);
