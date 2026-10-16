import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearLibraryGraphCache,
  handleTreeShake,
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

    // Create mock @code-ui/components in node_modules
    const pkgDir = path.join(tmpRoot, "node_modules", "@code-ui", "components");
    libDir = path.join(pkgDir, "dist");
    fs.mkdirSync(path.join(libDir, "runtime", "button"), { recursive: true });
    fs.mkdirSync(path.join(libDir, "runtime", "drawer"), { recursive: true });
    fs.mkdirSync(path.join(libDir, "wxs"), { recursive: true });

    fs.writeFileSync(
      path.join(pkgDir, "package.json"),
      JSON.stringify({
        name: "@code-ui/components",
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

    // Copy to dist/miniprogram_npm/@code-ui/components
    distLibDir = path.join(
      tmpRoot,
      "dist",
      "miniprogram_npm",
      "@code-ui",
      "components",
    );
    fs.cpSync(libDir, distLibDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    clearLibraryGraphCache();
  });

  it("purges unused components and WXS files when enabled, preserving transitive WXS deps", () => {
    const bundle = {
      "pages/index/index.json": {
        type: "asset",
        source: JSON.stringify({
          usingComponents: {
            "c-drawer": "@code-ui/components/runtime/drawer/index",
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
            "c-drawer": "@code-ui/components/runtime/drawer/index",
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
            "c-drawer": "@code-ui/components/runtime/drawer/index",
            "c-button": "@code-ui/components/runtime/button/index",
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
        `Component({});`,
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
            "c-button": "@code-ui/components/runtime/button/index",
            "c-card": "@code-ui/components/runtime/card/index",
            "c-chip": "@code-ui/components/runtime/chip/index",
            "c-pin-input": "@code-ui/components/runtime/pin-input/index",
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
});

