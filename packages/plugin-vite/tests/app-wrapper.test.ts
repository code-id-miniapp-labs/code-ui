import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  generateBundleAppWrapper,
  getAppPages,
  invalidateAppPagesCache,
  isPageFile,
  normalizePagePath,
  syncDiskAppWrapper,
  transformAppWrapper,
  wrapPageWxml,
} from "../src/core/app-wrapper";
import {
  generateBundleAutoImport,
  invalidateWxmlTagCache,
  syncDiskAutoImport,
  transformAutoImport,
} from "../src/core/auto-import";
import { resolveAppWrapperOptions, resolveAutoImportOptions } from "../src/core/config";
import type { OutputBundleLike } from "../src/types";

describe("app-wrapper", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cui-app-wrapper-"));
    invalidateAppPagesCache();
    invalidateWxmlTagCache();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    invalidateAppPagesCache();
    invalidateWxmlTagCache();
  });

  describe("wrapPageWxml", () => {
    const defaultOptions = resolveAppWrapperOptions(true, "c");

    it("wraps normal page template with <c-app>", () => {
      const input = `<view class="container"><text>Hello World</text></view>`;
      const output = wrapPageWxml(input, defaultOptions);

      expect(output).toBe(
        `<c-app>\n<view class="container"><text>Hello World</text></view>\n</c-app>\n`,
      );
    });

    it("supports pageMeta: true to explicitly inject <page-meta>", () => {
      const opts = resolveAppWrapperOptions({ pageMeta: true }, "c");
      const input = `<view class="container"><text>Hello World</text></view>`;
      const output = wrapPageWxml(input, opts);

      expect(output).toBe(
        `<page-meta page-style="{{ cuiPageStyle }}" />\n<c-app>\n<view class="container"><text>Hello World</text></view>\n</c-app>\n`,
      );
    });

    it("is idempotent: preserves template if already wrapped in <c-app>", () => {
      const input = `<c-app safe-area="top">\n<view>Hello</view>\n</c-app>`;
      const output = wrapPageWxml(input, defaultOptions);

      expect(output).toBe(input);
    });

    it("ensures <page-meta> is prepended if pageMeta: true and already wrapped in <c-app>", () => {
      const opts = resolveAppWrapperOptions({ pageMeta: true }, "c");
      const input = `<c-app safe-area="top">\n<view>Hello</view>\n</c-app>`;
      const output = wrapPageWxml(input, opts);

      expect(output).toBe(
        `<page-meta page-style="{{ cuiPageStyle }}" />\n<c-app safe-area="top">\n<view>Hello</view>\n</c-app>`,
      );
    });

    it("is idempotent: preserves template if already wrapped in <cui-app>", () => {
      const input = `<cui-app safe-area="both">\n<view>Hello</view>\n</cui-app>`;
      const output = wrapPageWxml(input, defaultOptions);

      expect(output).toBe(input);
    });

    it("does not treat <c-app> in attribute values as an existing wrapper", () => {
      const input = `<view><c-switch description="Coordinates with <c-app> to lock scroll" /></view>`;
      const output = wrapPageWxml(input, defaultOptions);

      expect(output).toBe(
        `<c-app>\n<view><c-switch description="Coordinates with <c-app> to lock scroll" /></view>\n</c-app>\n`,
      );
    });

    it("does not treat <c-app> in comments as an existing wrapper", () => {
      const input = `<!-- Wrapped with <c-app> -->\n<view>Hello</view>`;
      const output = wrapPageWxml(input, defaultOptions);

      expect(output).toBe(
        `<c-app>\n<!-- Wrapped with <c-app> -->\n<view>Hello</view>\n</c-app>\n`,
      );
    });

    it("preserves <page-meta> as the root element and merges page-style when pageMeta: true", () => {
      const opts = resolveAppWrapperOptions({ pageMeta: true }, "c");
      const input = `<page-meta page-style="{{ pageStyle }}">\n  <navigation-bar title="Title" />\n</page-meta>\n<view class="content">Body</view>`;
      const output = wrapPageWxml(input, opts);

      expect(output).toBe(
        `<page-meta page-style="{{ pageStyle }}; {{ cuiPageStyle }}">\n  <navigation-bar title="Title" />\n</page-meta>\n<c-app>\n<view class="content">Body</view>\n</c-app>\n`,
      );
    });

    it("handles self-closing <page-meta /> with style merging when pageMeta: true", () => {
      const opts = resolveAppWrapperOptions({ pageMeta: true }, "c");
      const input = `<page-meta page-style="background: #fff;" />\n<view class="content">Body</view>`;
      const output = wrapPageWxml(input, opts);

      expect(output).toBe(
        `<page-meta page-style="background: #fff; {{ cuiPageStyle }}" />\n<c-app>\n<view class="content">Body</view>\n</c-app>\n`,
      );
    });

    it("formats defaultProps correctly", () => {
      const opts = resolveAppWrapperOptions(
        {
          tag: "c-app",
          defaultProps: {
            "safe-area": "both",
            "lock-scroll": false,
            count: 42,
            active: true,
            className: "min-h-screen bg-gray-50",
          },
        },
        "c",
      );

      const input = `<view>Content</view>`;
      const output = wrapPageWxml(input, opts);

      expect(output).toContain(
        `safe-area="both" lock-scroll="{{ false }}" count="{{ 42 }}" active className="min-h-screen bg-gray-50"`,
      );
      expect(output).toContain("<c-app ");
      expect(output.endsWith("</c-app>\n")).toBe(true);
    });

    it("handles empty or whitespace-only template", () => {
      const output = wrapPageWxml("   \n   ", defaultOptions);
      expect(output).toBe(`<c-app>\n</c-app>\n`);
    });
  });

  describe("getAppPages & isPageFile", () => {
    it("discovers pages and subpackages from app.json", () => {
      const appJson = {
        pages: ["pages/index/index", "pages/app/index"],
        subPackages: [
          {
            root: "subPackageA",
            pages: ["pages/detail/index", "pages/list/index"],
          },
        ],
      };

      const srcDir = path.join(tmpDir, "src");
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(
        path.join(srcDir, "app.json"),
        JSON.stringify(appJson),
        "utf-8",
      );

      const pages = getAppPages(tmpDir);
      expect(pages.has("pages/index/index")).toBe(true);
      expect(pages.has("pages/app/index")).toBe(true);
      expect(pages.has("subPackageA/pages/detail/index")).toBe(true);
      expect(pages.has("subPackageA/pages/list/index")).toBe(true);
      expect(pages.has("pages/other/index")).toBe(false);
    });

    it("normalizes paths from src and dist", () => {
      expect(
        normalizePagePath(
          path.join(tmpDir, "src/pages/index/index.wxml"),
          tmpDir,
        ),
      ).toBe("pages/index/index");
      expect(
        normalizePagePath(
          path.join(tmpDir, "dist/pages/index/index.json"),
          tmpDir,
        ),
      ).toBe("pages/index/index");
      expect(
        normalizePagePath(
          path.join(tmpDir, "src/subPackageA/pages/detail/index.wxml"),
          tmpDir,
        ),
      ).toBe("subPackageA/pages/detail/index");
    });

    it("excludes files with companion .json declaring component: true", () => {
      const appJson = {
        pages: ["pages/index/index", "components/custom-card/index"],
      };
      fs.writeFileSync(
        path.join(tmpDir, "app.json"),
        JSON.stringify(appJson),
        "utf-8",
      );

      const pages = getAppPages(tmpDir);
      const cardDir = path.join(tmpDir, "components/custom-card");
      fs.mkdirSync(cardDir, { recursive: true });
      fs.writeFileSync(
        path.join(cardDir, "index.json"),
        `{ "component": true }`,
        "utf-8",
      );

      const cardWxml = path.join(cardDir, "index.wxml");
      fs.writeFileSync(cardWxml, `<view>Card</view>`, "utf-8");

      const opts = resolveAppWrapperOptions(true, "c");
      expect(isPageFile(cardWxml, tmpDir, pages, opts)).toBe(false);
    });

    it("supports include and exclude patterns", () => {
      const appJson = {
        pages: ["pages/index/index", "pages/login/index", "packageB/demo/index"],
      };
      fs.writeFileSync(
        path.join(tmpDir, "app.json"),
        JSON.stringify(appJson),
        "utf-8",
      );

      const pages = getAppPages(tmpDir);

      const excludeOpts = resolveAppWrapperOptions(
        {
          exclude: ["pages/login/index", /^packageB\//],
        },
        "c",
      );

      expect(
        isPageFile(
          path.join(tmpDir, "pages/index/index.wxml"),
          tmpDir,
          pages,
          excludeOpts,
        ),
      ).toBe(true);
      expect(
        isPageFile(
          path.join(tmpDir, "pages/login/index.wxml"),
          tmpDir,
          pages,
          excludeOpts,
        ),
      ).toBe(false);
      expect(
        isPageFile(
          path.join(tmpDir, "packageB/demo/index.wxml"),
          tmpDir,
          pages,
          excludeOpts,
        ),
      ).toBe(false);

      const includeOpts = resolveAppWrapperOptions(
        {
          include: ["pages/index/index"],
        },
        "c",
      );
      expect(
        isPageFile(
          path.join(tmpDir, "pages/index/index.wxml"),
          tmpDir,
          pages,
          includeOpts,
        ),
      ).toBe(true);
      expect(
        isPageFile(
          path.join(tmpDir, "pages/login/index.wxml"),
          tmpDir,
          pages,
          includeOpts,
        ),
      ).toBe(false);
    });
  });

  describe("transformAppWrapper & auto-import integration", () => {
    it("auto-injects c-app into page.json usingComponents", () => {
      const appJson = {
        pages: ["pages/home/index"],
      };
      fs.writeFileSync(
        path.join(tmpDir, "app.json"),
        JSON.stringify(appJson),
        "utf-8",
      );

      const pageDir = path.join(tmpDir, "pages/home");
      fs.mkdirSync(pageDir, { recursive: true });
      const wxmlPath = path.join(pageDir, "index.wxml");
      const jsonPath = path.join(pageDir, "index.json");

      fs.writeFileSync(wxmlPath, `<view><c-button>Hello</c-button></view>`, "utf-8");

      const autoImportOpts = resolveAutoImportOptions(true);
      const appWrapperOpts = resolveAppWrapperOptions(true, "c");

      // Transform JSON
      const jsonResult = transformAutoImport(
        `{"navigationBarTitleText": "Home"}`,
        jsonPath,
        autoImportOpts,
        tmpDir,
        appWrapperOpts,
      );

      expect(jsonResult).not.toBeNull();
      const parsedJson = JSON.parse(jsonResult?.code ?? "{}");
      expect(parsedJson.usingComponents).toEqual({
        "c-button": "@code-ui/components/runtime/button/index",
        "c-app": "@code-ui/components/runtime/app/index",
      });

      // Transform WXML
      const wxmlResult = transformAppWrapper(
        `<view><c-button>Hello</c-button></view>`,
        wxmlPath,
        tmpDir,
        appWrapperOpts,
      );

      expect(wxmlResult).not.toBeNull();
      expect(wxmlResult?.code).toBe(
        `<c-app>\n<view><c-button>Hello</c-button></view>\n</c-app>\n`,
      );
    });

    it("auto-injects c-app even when page.wxml has no code-ui component tags", () => {
      const appJson = {
        pages: ["pages/simple/index"],
      };
      fs.writeFileSync(
        path.join(tmpDir, "app.json"),
        JSON.stringify(appJson),
        "utf-8",
      );

      const pageDir = path.join(tmpDir, "pages/simple");
      fs.mkdirSync(pageDir, { recursive: true });
      const wxmlPath = path.join(pageDir, "index.wxml");
      const jsonPath = path.join(pageDir, "index.json");

      fs.writeFileSync(wxmlPath, `<view class="plain">Just plain text</view>`, "utf-8");

      const autoImportOpts = resolveAutoImportOptions(true);
      const appWrapperOpts = resolveAppWrapperOptions(true, "c");

      const jsonResult = transformAutoImport(
        `{}`,
        jsonPath,
        autoImportOpts,
        tmpDir,
        appWrapperOpts,
      );

      expect(jsonResult).not.toBeNull();
      const parsedJson = JSON.parse(jsonResult?.code ?? "{}");
      expect(parsedJson.usingComponents).toEqual({
        "c-app": "@code-ui/components/runtime/app/index",
      });
    });

    it("does not inject c-app for components that are not pages", () => {
      const appJson = {
        pages: ["pages/home/index"],
      };
      fs.writeFileSync(
        path.join(tmpDir, "app.json"),
        JSON.stringify(appJson),
        "utf-8",
      );

      const compDir = path.join(tmpDir, "components/my-comp");
      fs.mkdirSync(compDir, { recursive: true });
      const wxmlPath = path.join(compDir, "index.wxml");
      const jsonPath = path.join(compDir, "index.json");

      fs.writeFileSync(wxmlPath, `<view><c-button>Comp</c-button></view>`, "utf-8");

      const autoImportOpts = resolveAutoImportOptions(true);
      const appWrapperOpts = resolveAppWrapperOptions(true, "c");

      const jsonResult = transformAutoImport(
        `{"component": true}`,
        jsonPath,
        autoImportOpts,
        tmpDir,
        appWrapperOpts,
      );

      expect(jsonResult).not.toBeNull();
      const parsedJson = JSON.parse(jsonResult?.code ?? "{}");
      expect(parsedJson.usingComponents).toEqual({
        "c-button": "@code-ui/components/runtime/button/index",
      });
      expect(parsedJson.usingComponents["c-app"]).toBeUndefined();
    });
  });

  describe("bundle and disk sync", () => {
    it("wraps bundle assets and syncs disk files", () => {
      const appJson = {
        pages: ["pages/demo/index"],
      };
      fs.writeFileSync(
        path.join(tmpDir, "app.json"),
        JSON.stringify(appJson),
        "utf-8",
      );

      const autoImportOpts = resolveAutoImportOptions(true);
      const appWrapperOpts = resolveAppWrapperOptions(true, "c");

      const bundle: OutputBundleLike = {
        "pages/demo/index.wxml": {
          type: "asset",
          fileName: "pages/demo/index.wxml",
          source: `<view>Bundle Template</view>`,
        },
        "pages/demo/index.json": {
          type: "asset",
          fileName: "pages/demo/index.json",
          source: `{}`,
        },
      };

      generateBundleAppWrapper(bundle, appWrapperOpts, tmpDir);
      generateBundleAutoImport(bundle, autoImportOpts, tmpDir, appWrapperOpts);

      expect((bundle["pages/demo/index.wxml"] as any).source).toBe(
        `<c-app>\n<view>Bundle Template</view>\n</c-app>\n`,
      );

      const parsedJson = JSON.parse(
        (bundle["pages/demo/index.json"] as any).source,
      );
      expect(parsedJson.usingComponents).toEqual({
        "c-app": "@code-ui/components/runtime/app/index",
      });

      // Test disk syncing
      const distDir = path.join(tmpDir, "dist");
      const distPageDir = path.join(distDir, "pages/demo");
      fs.mkdirSync(distPageDir, { recursive: true });
      fs.writeFileSync(
        path.join(distPageDir, "index.wxml"),
        `<view>Disk Template</view>`,
        "utf-8",
      );
      fs.writeFileSync(
        path.join(distPageDir, "index.json"),
        `{}`,
        "utf-8",
      );

      syncDiskAppWrapper(distDir, appWrapperOpts, tmpDir);
      syncDiskAutoImport(distDir, autoImportOpts, tmpDir, undefined, appWrapperOpts);

      const diskWxml = fs.readFileSync(path.join(distPageDir, "index.wxml"), "utf-8");
      expect(diskWxml).toBe(
        `<c-app>\n<view>Disk Template</view>\n</c-app>\n`,
      );

      const diskJson = JSON.parse(
        fs.readFileSync(path.join(distPageDir, "index.json"), "utf-8"),
      );
      expect(diskJson.usingComponents).toEqual({
        "c-app": "@code-ui/components/runtime/app/index",
      });
    });
  });
});

