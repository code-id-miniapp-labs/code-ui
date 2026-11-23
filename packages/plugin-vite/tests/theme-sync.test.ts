import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { afterEach, describe, expect, it } from "vitest";
import { PluginConfigManager } from "../src/core/config";
import {
  buildPremergedComponentThemeSource,
  syncCompiledComponentThemes,
} from "../src/core/theme-sync";

function evalCjsModule(source: string): any {
  const mod = { exports: {} as any };
  const fn = new Function("module", "exports", source);
  fn(mod, mod.exports);
  return mod.exports;
}

describe("build-time pre-merged component theme sync", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("emits CJS module with pm: 1 and component overrides", () => {
    const source = buildPremergedComponentThemeSource("drawer", {
      prefix: "c",
      ui: {
        colors: { primary: "red" },
      },
      components: {
        drawer: {
          slots: {
            closeTrigger:
              "size-8 rounded-full bg-light-gray flex justify-center items-center",
            content: "rounded-t-[40rpx]",
            grabber: "hidden",
          },
        },
      },
    });

    expect(source).toBeTruthy();
    expect(source).toContain("module.exports = ");
    const parsed = evalCjsModule(source as string);
    expect(parsed.name).toBe("drawer");
    expect(parsed.pm).toBe(1);
    expect(parsed.overrides).toEqual([
      {
        slots: {
          closeTrigger:
            "size-8 rounded-full bg-light-gray flex justify-center items-center",
          content: "rounded-t-[40rpx]",
          grabber: "hidden",
        },
      },
    ]);
  });

  it("patches miniprogram_npm runtime theme.js files and is idempotent", () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cui-theme-sync-"));
    tempDirs.push(tmpRoot);

    const drawerDir = path.join(
      tmpRoot,
      "dist",
      "miniprogram_npm",
      "@code-id-labs",
      "components",
      "runtime",
      "drawer",
    );
    fs.mkdirSync(drawerDir, { recursive: true });
    const themePath = path.join(drawerDir, "theme.js");
    fs.writeFileSync(themePath, "module.exports = { name: 'drawer' };", "utf8");

    const configManager = new PluginConfigManager({
      components: {
        drawer: {
          slots: {
            closeTrigger: "size-8 rounded-full bg-light-gray",
          },
        },
      },
    });

    const firstCount = syncCompiledComponentThemes(
      configManager,
      { enable: false },
      tmpRoot,
      { build: { outDir: "dist" } },
    );
    expect(firstCount).toBe(1);

    const written = fs.readFileSync(themePath, "utf8");
    const mod = vm.runInNewContext(
      `(() => { const module = { exports: {} }; ${written}; return module.exports; })()`,
    );
    expect(mod.pm).toBe(1);
    expect(mod.overrides?.[0]?.slots?.closeTrigger).toBe(
      "size-8 rounded-full bg-light-gray",
    );

    // Second run with identical config must be a no-op
    const secondCount = syncCompiledComponentThemes(
      configManager,
      { enable: false },
      tmpRoot,
      { build: { outDir: "dist" } },
    );
    expect(secondCount).toBe(0);
  });
});
