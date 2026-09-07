import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig } from "tsdown";

function copyDirRecursive(source: string, target: string) {
  if (!existsSync(source)) return;
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }

  const entries = readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(source, entry.name);
    const destPath = join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (
      entry.name.endsWith(".wxml") ||
      entry.name.endsWith(".wxss") ||
      entry.name.endsWith(".json")
    ) {
      copyFileSync(srcPath, destPath);
    }
  }
}

function copyDtsRecursive(currentDir: string) {
  if (!existsSync(currentDir)) return;
  const entries = readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(currentDir, entry.name);
    if (entry.isDirectory()) {
      copyDtsRecursive(fullPath);
    } else if (entry.name.endsWith(".d.cts")) {
      const dtsPath = join(currentDir, entry.name.replace(".d.cts", ".d.ts"));
      if (!existsSync(dtsPath)) {
        copyFileSync(fullPath, dtsPath);
      }
    } else if (entry.name.endsWith(".d.ts") && !entry.name.endsWith(".d.cts")) {
      const dctsPath = join(currentDir, entry.name.replace(".d.ts", ".d.cts"));
      if (!existsSync(dctsPath)) {
        copyFileSync(fullPath, dctsPath);
      }
    }
  }
}

function duplicateDts(distDir: string) {
  copyDtsRecursive(distDir);
}

interface WxsCopyEntry {
  component: string;
  componentDist: string;
}

const wxsCopyMap: WxsCopyEntry[] = [
  {
    component: "drawer",
    componentDist: "drawer",
  },
];

function getMachineWxsPath(component: string, rootDir: string): string | null {
  const srcWxs = resolve(rootDir, `../machines/${component}/src/wxs`);
  if (existsSync(srcWxs)) return srcWxs;
  const distWxs = resolve(rootDir, `../machines/${component}/dist/wxs`);
  if (existsSync(distWxs)) return distWxs;
  return null;
}

function copySharedWxs(rootDir: string, distDir: string) {
  const sharedWxsDest = resolve(distDir, "_shared/wxs");
  mkdirSync(sharedWxsDest, { recursive: true });

  const utilsWxsSrc = resolve(rootDir, "../utils/src/wxs/dom.wxs");
  const utilsWxsDist = resolve(rootDir, "../utils/dist/wxs/dom.wxs");
  const domWxsPath = existsSync(utilsWxsSrc)
    ? utilsWxsSrc
    : existsSync(utilsWxsDist)
      ? utilsWxsDist
      : null;

  if (domWxsPath) {
    copyFileSync(domWxsPath, join(sharedWxsDest, "dom.wxs"));
  }
}

function copyWxs(item: WxsCopyEntry, rootDir: string, distDir: string) {
  const from = getMachineWxsPath(item.component, rootDir);
  if (!from) return;

  const componentDest = resolve(distDir, item.componentDist);
  mkdirSync(componentDest, { recursive: true });

  for (const file of readdirSync(from)) {
    if (!file.endsWith(".wxs") || file === "dom.wxs") continue;

    const srcPath = join(from, file);
    let content = readFileSync(srcPath, "utf8");
    content = content.replace(
      "require('./dom.wxs')",
      "require('../_shared/wxs/dom.wxs')",
    );
    writeFileSync(join(componentDest, file), content);
  }
}

async function copyAssets() {
  const rootDir = process.cwd();
  const srcDir = resolve(rootDir, "src");
  const distDir = resolve(rootDir, "dist");

  copyDirRecursive(srcDir, distDir);
  copySharedWxs(rootDir, distDir);
  for (const item of wxsCopyMap) {
    copyWxs(item, rootDir, distDir);
  }
  duplicateDts(distDir);
  console.log(
    "✔ Copied WXML, WXSS, JSON assets, WXS (from @code-ui/utils to _shared/wxs), and verified .d.ts files in dist/",
  );
}

let pendingResolvers: Array<() => void> = [];
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

function triggerCopyAssets(): Promise<void> {
  return new Promise<void>((done) => {
    pendingResolvers.push(done);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        await copyAssets();
      } finally {
        const resolvers = pendingResolvers;
        pendingResolvers = [];
        resolvers.forEach((r) => r());
      }
    }, 150);
  });
}

const externalizeSharedRuntimePlugin = {
  name: "externalize-shared-runtime",
  resolveId(id: string, importer?: string) {
    if (
      importer &&
      (importer.endsWith(".d.ts") ||
        importer.endsWith(".d.mts") ||
        importer.endsWith(".d.cts"))
    ) {
      return null;
    }
    const sharedPkgs = [
      "@code-ui/core",
      "@code-ui/anatomy",
      "@code-ui/utils",
      "@code-ui/miniapp",
      "alien-signals",
    ];
    if (sharedPkgs.includes(id)) {
      return {
        id: "../_shared/runtime",
        external: true,
      };
    }
    return null;
  },
};

export default defineConfig([
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
    target: "es2020",
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    deps: {
      onlyBundle: false,
      alwaysBundle: [/@code-ui\/.*/, "alien-signals"],
    },
    outExtensions({ format }) {
      return {
        js: format === "es" ? ".mjs" : ".js",
        dts: ".d.ts",
      };
    },
    hooks: {
      "build:done": triggerCopyAssets,
    },
  },

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
    target: "es2020",
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    deps: {
      onlyBundle: false,
      alwaysBundle: [/@code-ui\/.*/, "alien-signals"],
    },
    outExtensions() {
      return { js: ".js", dts: ".d.ts" };
    },
    hooks: {
      "build:done": triggerCopyAssets,
    },
  },

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
    target: "es2020",
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    deps: {
      onlyBundle: false,
      alwaysBundle: [/@code-ui\/.*/, "alien-signals"],
      neverBundle: [
        "../_shared/runtime",
        "../_shared/runtime.js",
        "../_shared/runtime.cjs",
      ],
    },
    plugins: [externalizeSharedRuntimePlugin],
    outExtensions() {
      return { js: ".js", dts: ".d.ts" };
    },
    hooks: {
      "build:done": triggerCopyAssets,
    },
  },
]);
