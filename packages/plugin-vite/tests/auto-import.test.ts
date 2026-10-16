import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  generateBundleAutoImport,
  invalidateWxmlTagCache,
  syncDiskAutoImport,
  transformAutoImport,
} from "../src/core/auto-import";

describe("auto-import", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cui-auto-import-"));
    invalidateWxmlTagCache();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    invalidateWxmlTagCache();
  });

  it("transforms page.json by scanning matching page.wxml tags", () => {
    const wxmlPath = path.join(tmpDir, "index.wxml");
    const jsonPath = path.join(tmpDir, "index.json");

    fs.writeFileSync(
      wxmlPath,
      `<view><c-button>Click</c-button><c-drawer /><c-button>Again</c-button></view>`,
      "utf-8",
    );

    const res = transformAutoImport(
      `{"navigationBarTitleText": "Home"}`,
      jsonPath,
      {
        enable: true,
      },
    );

    expect(res).not.toBeNull();
    const parsed = JSON.parse(res?.code ?? "{}");
    expect(parsed.usingComponents).toEqual({
      "c-button": "@code-ui/components/runtime/button/index",
      "c-drawer": "@code-ui/components/runtime/drawer/index",
    });
  });

  it("preserves export default wrapper and existing usingComponents entries", () => {
    const wxmlPath = path.join(tmpDir, "page.wxml");
    const jsonPath = path.join(tmpDir, "page.json");

    fs.writeFileSync(wxmlPath, `<c-button /><c-drawer />`, "utf-8");

    const input = `export default {"usingComponents": {"c-button": "/custom/button"}};`;
    const res = transformAutoImport(input, `${jsonPath}?import`, {
      enable: true,
    });

    expect(res).not.toBeNull();
    const code = res?.code ?? "";
    expect(code.startsWith("export default {")).toBe(true);
    const jsonBody = code.replace(/^export default\s+/, "").replace(/;$/, "");
    const parsed = JSON.parse(jsonBody);
    expect(parsed.usingComponents).toEqual({
      "c-button": "/custom/button",
      "c-drawer": "@code-ui/components/runtime/drawer/index",
    });
  });

  it("caches parsed WXML tags and refreshes when invalidated", () => {
    const wxmlPath = path.join(tmpDir, "cached.wxml");
    const jsonPath = path.join(tmpDir, "cached.json");

    fs.writeFileSync(wxmlPath, `<c-button />`, "utf-8");

    const first = transformAutoImport(`{}`, jsonPath, { enable: true });
    expect(JSON.parse(first?.code ?? "{}").usingComponents).toEqual({
      "c-button": "@code-ui/components/runtime/button/index",
    });

    // Update WXML and invalidate cache
    fs.writeFileSync(wxmlPath, `<c-button /><c-drawer />`, "utf-8");
    invalidateWxmlTagCache(wxmlPath);

    const second = transformAutoImport(`{}`, jsonPath, { enable: true });
    expect(JSON.parse(second?.code ?? "{}").usingComponents).toEqual({
      "c-button": "@code-ui/components/runtime/button/index",
      "c-drawer": "@code-ui/components/runtime/drawer/index",
    });
  });

  it("updates bundle JSON assets in generateBundleAutoImport including Uint8Array sources", () => {
    const srcPageDir = path.join(tmpDir, "src", "pages", "home");
    fs.mkdirSync(srcPageDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcPageDir, "index.wxml"),
      `<view><c-drawer /></view>`,
      "utf-8",
    );

    const bundle: Record<string, any> = {
      "pages/home/index.json": {
        type: "asset",
        source: new TextEncoder().encode(JSON.stringify({ component: true })),
      },
    };

    generateBundleAutoImport(bundle, { enable: true }, tmpDir);

    const updated = JSON.parse(bundle["pages/home/index.json"].source);
    expect(updated.usingComponents).toEqual({
      "c-drawer": "@code-ui/components/runtime/drawer/index",
    });
  });

  it("syncs disk JSON files when WXML changes without JSON being re-emitted in watch mode", () => {
    const srcPageDir = path.join(tmpDir, "src", "pages", "index");
    const distPageDir = path.join(tmpDir, "dist", "pages", "index");
    fs.mkdirSync(srcPageDir, { recursive: true });
    fs.mkdirSync(distPageDir, { recursive: true });

    fs.writeFileSync(
      path.join(srcPageDir, "index.wxml"),
      `<view><c-button /><c-card /><c-chip /><c-pin-input /></view>`,
      "utf-8",
    );
    fs.writeFileSync(
      path.join(distPageDir, "index.json"),
      JSON.stringify({
        usingComponents: {
          "c-button": "@code-ui/components/runtime/button/index",
        },
      }),
      "utf-8",
    );

    syncDiskAutoImport(path.join(tmpDir, "dist"), { enable: true }, tmpDir);

    const updated = JSON.parse(
      fs.readFileSync(path.join(distPageDir, "index.json"), "utf-8"),
    );
    expect(updated.usingComponents).toEqual({
      "c-button": "@code-ui/components/runtime/button/index",
      "c-card": "@code-ui/components/runtime/card/index",
      "c-chip": "@code-ui/components/runtime/chip/index",
      "c-pin-input": "@code-ui/components/runtime/pin-input/index",
    });
  });
});

