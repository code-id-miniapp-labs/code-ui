import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { codeUI } from "../src/index";
import {
  clearLibraryGraphCache,
  flushPendingExitTreeShakes,
  handleTreeShake,
  isWeappViteConfig,
  waitForMiniprogramNpmStable,
} from "../src/core/tree-shake";

describe("tree-shake", () => {
  let tmpRoot: string;
  let libDir: string;
  let distLibDir: string;

  beforeEach(() => {
    clearLibraryGraphCache();
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cui-treeshake-"));

    // Create root package.json so createRequire can resolve from tmpRoot
    fs.writeFileSync(
      path.join(tmpRoot, "package.json"),
      JSON.stringify({ name: "test-app", private: true }),
      "utf-8",
    );

    // Create mock @code-id-labs/components in node_modules
    const pkgDir = path.join(tmpRoot, "node_modules", "@code-id-labs", "components");
    libDir = path.join(pkgDir, "dist");
    fs.mkdirSync(path.join(libDir, "runtime", "button"), { recursive: true });
    fs.mkdirSync(path.join(libDir, "runtime", "drawer"), { recursive: true });
    fs.mkdirSync(path.join(libDir, "wxs"), { recursive: true });

    fs.writeFileSync(
      path.join(pkgDir, "package.json"),
      JSON.stringify({
        name: "@code-id-labs/components",
        miniprogram: "dist",
      }),
      "utf-8",
    );

    // Button has no WXS deps
    fs.writeFileSync(
      path.join(libDir, "runtime", "button", "index.json"),
      JSON.stringify({ component: true, usingComponents: {} }),
      "utf-8",
    );
    fs.writeFileSync(
      path.join(libDir, "runtime", "button", "index.wxml"),
      `<button class="btn"><slot /></button>`,
      "utf-8",
    );

    // Drawer depends on wxs/drawer-gesture.wxs which requires ./dom.wxs
    fs.writeFileSync(
      path.join(libDir, "runtime", "drawer", "index.json"),
      JSON.stringify({ component: true, usingComponents: {} }),
      "utf-8",
    );
    fs.writeFileSync(
      path.join(libDir, "runtime", "drawer", "index.wxml"),
      `<wxs src="../../wxs/drawer-gesture.wxs" module="gesture" /><view />`,
      "utf-8",
    );

    fs.writeFileSync(
      path.join(libDir, "wxs", "drawer-gesture.wxs"),
      `var dom = require("./dom.wxs"); module.exports = {};`,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(libDir, "wxs", "dom.wxs"),
      `module.exports = {};`,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(libDir, "wxs", "unused.wxs"),
      `module.exports = {};`,
      "utf-8",
    );

    // Copy to dist/miniprogram_npm/@code-id-labs/components
    distLibDir = path.join(
      tmpRoot,
      "dist",
      "miniprogram_npm",
      "@code-id-labs",
      "components",
    );
    fs.cpSync(libDir, distLibDir, { recursive: true });
  });

  afterEach(() => {
    flushPendingExitTreeShakes(1);
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    clearLibraryGraphCache();
  });

  it("purges unused components and WXS files when enabled, preserving transitive WXS deps", () => {
    const bundle = {
      "pages/index/index.json": {
        type: "asset",
        source: JSON.stringify({
          usingComponents: {
            "c-drawer": "@code-id-labs/components/runtime/drawer/index",
          },
        }),
      },
    };

    handleTreeShake(
      { enable: true },
      tmpRoot,
      { build: { outDir: "dist" } },
      bundle,
    );

    // Drawer and its transitive WXS (drawer-gesture.wxs + dom.wxs) should remain
    expect(fs.existsSync(path.join(distLibDir, "runtime", "drawer"))).toBe(
      true,
    );
    expect(
      fs.existsSync(path.join(distLibDir, "wxs", "drawer-gesture.wxs")),
    ).toBe(true);
    expect(fs.existsSync(path.join(distLibDir, "wxs", "dom.wxs"))).toBe(true);

    // Unused button component and unused.wxs should be purged
    expect(fs.existsSync(path.join(distLibDir, "runtime", "button"))).toBe(
      false,
    );
    expect(fs.existsSync(path.join(distLibDir, "wxs", "unused.wxs"))).toBe(
      false,
    );
  });

  it("restores previously pruned components when they become used again", () => {
    // First prune button
    const bundleOnlyDrawer = {
      "pages/index/index.json": {
        type: "asset",
        source: JSON.stringify({
          usingComponents: {
            "c-drawer": "@code-id-labs/components/runtime/drawer/index",
          },
        }),
      },
    };
    handleTreeShake(
      { enable: true },
      tmpRoot,
      { build: { outDir: "dist" } },
      bundleOnlyDrawer,
    );
    expect(fs.existsSync(path.join(distLibDir, "runtime", "button"))).toBe(
      false,
    );

    // Now add c-button to bundle and run with enable: false (dev mode)
    const bundleWithButton = {
      "pages/index/index.json": {
        type: "asset",
        source: JSON.stringify({
          usingComponents: {
            "c-drawer": "@code-id-labs/components/runtime/drawer/index",
            "c-button": "@code-id-labs/components/runtime/button/index",
          },
        }),
      },
    };
    handleTreeShake(
      { enable: false },
      tmpRoot,
      { build: { outDir: "dist" } },
      bundleWithButton,
    );
    expect(fs.existsSync(path.join(distLibDir, "runtime", "button"))).toBe(
      true,
    );
  });

  it("syncs newly built components and updated root chunks when weapp-vite skips npm rebuild", () => {
    // Initial run caches graph
    handleTreeShake({ enable: false }, tmpRoot, { build: { outDir: "dist" } });

    // Simulate building new components (card, chip, pin-input) and updating common.js in library dist
    for (const name of ["card", "chip", "pin-input"]) {
      const compDir = path.join(libDir, "runtime", name);
      fs.mkdirSync(compDir, { recursive: true });
      fs.writeFileSync(
        path.join(compDir, "index.json"),
        JSON.stringify({ component: true, usingComponents: {} }),
        "utf-8",
      );
      fs.writeFileSync(
        path.join(compDir, "index.js"),
        `const common = require("../../common.js");\nComponent({});`,
        "utf-8",
      );
    }
    fs.writeFileSync(
      path.join(libDir, "common.js"),
      `module.exports = { version: 2 };`,
      "utf-8",
    );

    const bundle = {
      "pages/index/index.json": {
        type: "asset",
        source: JSON.stringify({
          usingComponents: {
            "c-button": "@code-id-labs/components/runtime/button/index",
            "c-card": "@code-id-labs/components/runtime/card/index",
            "c-chip": "@code-id-labs/components/runtime/chip/index",
            "c-pin-input": "@code-id-labs/components/runtime/pin-input/index",
          },
        }),
      },
    };

    handleTreeShake(
      { enable: true },
      tmpRoot,
      { build: { outDir: "dist" } },
      bundle,
    );

    expect(
      fs.existsSync(path.join(distLibDir, "runtime", "card", "index.js")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(distLibDir, "runtime", "chip", "index.js")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(distLibDir, "runtime", "pin-input", "index.js")),
    ).toBe(true);
    expect(fs.readFileSync(path.join(distLibDir, "common.js"), "utf-8")).toBe(
      `module.exports = { version: 2 };`,
    );
  });

  it("purges unreferenced chunks and restores them when components are re-added", () => {
    fs.writeFileSync(
      path.join(libDir, "computed-behavior.js"),
      `module.exports = { computed: true };`,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(libDir, "stepper.js"),
      `module.exports = { stepper: true };`,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(distLibDir, "computed-behavior.js"),
      `module.exports = { computed: true };`,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(distLibDir, "stepper.js"),
      `module.exports = { stepper: true };`,
      "utf-8",
    );

    // drawer requires computed-behavior.js
    fs.writeFileSync(
      path.join(libDir, "runtime", "drawer", "index.js"),
      `const comp = require("../../computed-behavior.js"); Component({});`,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(distLibDir, "runtime", "drawer", "index.js"),
      `const comp = require("../../computed-behavior.js"); Component({});`,
      "utf-8",
    );

    // button requires stepper.js
    fs.writeFileSync(
      path.join(libDir, "runtime", "button", "index.js"),
      `const stp = require("../../stepper.js"); Component({});`,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(distLibDir, "runtime", "button", "index.js"),
      `const stp = require("../../stepper.js"); Component({});`,
      "utf-8",
    );

    // Run tree-shake with ONLY drawer used
    const bundleOnlyDrawer = {
      "pages/index/index.json": {
        type: "asset",
        source: JSON.stringify({
          usingComponents: {
            "c-drawer": "@code-id-labs/components/runtime/drawer/index",
          },
        }),
      },
    };

    handleTreeShake(
      { enable: true },
      tmpRoot,
      { build: { outDir: "dist" } },
      bundleOnlyDrawer,
    );

    // Button should be purged
    expect(fs.existsSync(path.join(distLibDir, "runtime", "button"))).toBe(false);
    // computed-behavior.js is required by drawer so it stays
    expect(fs.existsSync(path.join(distLibDir, "computed-behavior.js"))).toBe(true);
    // stepper.js was only required by button so it is purged
    expect(fs.existsSync(path.join(distLibDir, "stepper.js"))).toBe(false);

    // Now re-add button
    const bundleWithButton = {
      "pages/index/index.json": {
        type: "asset",
        source: JSON.stringify({
          usingComponents: {
            "c-drawer": "@code-id-labs/components/runtime/drawer/index",
            "c-button": "@code-id-labs/components/runtime/button/index",
          },
        }),
      },
    };

    handleTreeShake(
      { enable: true },
      tmpRoot,
      { build: { outDir: "dist" } },
      bundleWithButton,
    );

    // Button should be restored
    expect(fs.existsSync(path.join(distLibDir, "runtime", "button"))).toBe(true);
    // stepper.js should be restored!
    expect(fs.existsSync(path.join(distLibDir, "stepper.js"))).toBe(true);
  });

  it("defers tree-shake to clean process exit under weapp-vite so concurrent collectCopiedPackageRequests never hits ENOENT", async () => {
    // Add an unused switch component with index.js (reproducing the exact ENOENT crash)
    const switchSrcDir = path.join(libDir, "runtime", "switch");
    fs.mkdirSync(switchSrcDir, { recursive: true });
    fs.writeFileSync(
      path.join(switchSrcDir, "index.json"),
      JSON.stringify({ component: true, usingComponents: {} }),
      "utf-8",
    );
    fs.writeFileSync(
      path.join(switchSrcDir, "index.js"),
      `Component({});`,
      "utf-8",
    );
    fs.cpSync(switchSrcDir, path.join(distLibDir, "runtime", "switch"), {
      recursive: true,
    });

    // Write emitted page JSON referencing ONLY c-drawer (not c-switch or c-button)
    const pageDir = path.join(tmpRoot, "dist", "pages", "index");
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(
      path.join(pageDir, "index.json"),
      JSON.stringify({
        usingComponents: {
          "c-drawer": "@code-id-labs/components/runtime/drawer/index",
        },
      }),
      "utf-8",
    );

    const plugin = codeUI({ treeShake: true });
    const mockWeappConfig = {
      root: tmpRoot,
      build: { outDir: "dist", cssMinify: false },
      plugins: [{ name: "weapp-vite:compiler:output" }],
    };
    expect(isWeappViteConfig(mockWeappConfig)).toBe(true);

    const configResolvedHook =
      typeof plugin.configResolved === "function"
        ? plugin.configResolved
        : plugin.configResolved?.handler;
    await configResolvedHook?.call({} as any, mockWeappConfig as any);

    const closeBundleHook =
      typeof plugin.closeBundle === "function"
        ? plugin.closeBundle
        : plugin.closeBundle?.handler;

    // Simulate weapp-vite's buildEntry:
    // npmBuildTask runs concurrently with Vite's closeBundle and reads copied
    // .js files (collectCopiedPackageRequests) AFTER closeBundle has returned.
    const switchDistJs = path.join(
      distLibDir,
      "runtime",
      "switch",
      "index.js",
    );
    const npmBuildTask = (async () => {
      // Simulate delay longer than waitForMiniprogramNpmStable while other
      // packages settle before collectCopiedPackageRequests scans switch/index.js
      await new Promise((resolve) => setTimeout(resolve, 150));
      const content = await fsp.readFile(switchDistJs, "utf-8");
      return content;
    })();

    // Vite finishes closeBundle first
    await closeBundleHook?.call({ meta: { watchMode: false } } as any);

    // switch/index.js MUST still exist until weapp-vite finishes awaiting npmBuildTask
    expect(fs.existsSync(switchDistJs)).toBe(true);
    await expect(npmBuildTask).resolves.toBe(`Component({});`);

    // Once weapp-vite exits cleanly (code 0), deferred tree-shake runs synchronously
    flushPendingExitTreeShakes(0);

    expect(fs.existsSync(path.join(distLibDir, "runtime", "drawer"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(distLibDir, "runtime", "switch"))).toBe(
      false,
    );
    expect(fs.existsSync(path.join(distLibDir, "runtime", "button"))).toBe(
      false,
    );
  });

  it("skips deferred tree-shake when process exits with a non-zero exit code", async () => {
    const pageDir = path.join(tmpRoot, "dist", "pages", "index");
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(
      path.join(pageDir, "index.json"),
      JSON.stringify({
        usingComponents: {
          "c-drawer": "@code-id-labs/components/runtime/drawer/index",
        },
      }),
      "utf-8",
    );

    const plugin = codeUI({ treeShake: true });
    const configResolvedHook =
      typeof plugin.configResolved === "function"
        ? plugin.configResolved
        : plugin.configResolved?.handler;
    await configResolvedHook?.call(
      {} as any,
      {
        root: tmpRoot,
        build: { outDir: "dist", cssMinify: false },
        plugins: [{ name: "weapp-vite:compiler:output" }],
      } as any,
    );

    const closeBundleHook =
      typeof plugin.closeBundle === "function"
        ? plugin.closeBundle
        : plugin.closeBundle?.handler;
    await closeBundleHook?.call({ meta: { watchMode: false } } as any);

    flushPendingExitTreeShakes(1);

    // Unused button was NOT purged because build failed (exit code 1)
    expect(fs.existsSync(path.join(distLibDir, "runtime", "button"))).toBe(
      true,
    );
  });

  it("runs tree-shake immediately in closeBundle when not running under weapp-vite", async () => {
    const pageDir = path.join(tmpRoot, "dist", "pages", "index");
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(
      path.join(pageDir, "index.json"),
      JSON.stringify({
        usingComponents: {
          "c-drawer": "@code-id-labs/components/runtime/drawer/index",
        },
      }),
      "utf-8",
    );

    const plugin = codeUI({ treeShake: true });
    const configResolvedHook =
      typeof plugin.configResolved === "function"
        ? plugin.configResolved
        : plugin.configResolved?.handler;
    await configResolvedHook?.call(
      {} as any,
      {
        root: tmpRoot,
        build: { outDir: "dist", cssMinify: false },
        plugins: [{ name: "vite:css" }],
      } as any,
    );

    const closeBundleHook =
      typeof plugin.closeBundle === "function"
        ? plugin.closeBundle
        : plugin.closeBundle?.handler;
    await closeBundleHook?.call({ meta: { watchMode: false } } as any);

    expect(fs.existsSync(path.join(distLibDir, "runtime", "drawer"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(distLibDir, "runtime", "button"))).toBe(
      false,
    );
  });

  it("does not purge components during generateBundle in watchMode", async () => {
    const plugin = codeUI({ treeShake: true });
    const configResolvedHook =
      typeof plugin.configResolved === "function"
        ? plugin.configResolved
        : plugin.configResolved?.handler;
    await configResolvedHook?.call(
      {} as any,
      {
        root: tmpRoot,
        build: { outDir: "dist", cssMinify: false },
        plugins: [{ name: "weapp-vite:compiler:output" }],
      } as any,
    );

    const generateBundleHook =
      typeof plugin.generateBundle === "function"
        ? plugin.generateBundle
        : plugin.generateBundle?.handler;

    const bundle = {
      "pages/index/index.json": {
        type: "asset",
        source: JSON.stringify({
          usingComponents: {
            "c-drawer": "@code-id-labs/components/runtime/drawer/index",
          },
        }),
      },
    };

    generateBundleHook?.call(
      { meta: { watchMode: true } } as any,
      {} as any,
      bundle as any,
      false,
    );

    // generateBundle must NOT delete unused components while npm copy may be in flight
    expect(fs.existsSync(path.join(distLibDir, "runtime", "button"))).toBe(
      true,
    );
  });

  it("waitForMiniprogramNpmStable waits for concurrent writes in sibling miniprogram_npm packages", async () => {
    const siblingDir = path.join(tmpRoot, "dist", "miniprogram_npm", "other-pkg");
    fs.mkdirSync(siblingDir, { recursive: true });
    fs.writeFileSync(path.join(siblingDir, "index.js"), "v1", "utf-8");

    let wroteSecondFile = false;
    const writer = new Promise<void>((resolve) => {
      setTimeout(() => {
        fs.writeFileSync(path.join(siblingDir, "chunk.js"), "v2", "utf-8");
        wroteSecondFile = true;
        resolve();
      }, 30);
    });

    await waitForMiniprogramNpmStable(
      { enable: true },
      tmpRoot,
      { build: { outDir: "dist" } },
      { settleMs: 60, maxWaitMs: 1000 },
    );
    await writer;

    expect(wroteSecondFile).toBe(true);
  });
});

