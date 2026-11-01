import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateThemeCSS, SHADES } from "../src/core/theme";
import { transformAppStyle } from "../src/core/style-inject";
import { PluginConfigManager } from "../src/core/config";
import { collectUsedComponents } from "../src/core/used-components";

describe("generateThemeCSS", () => {
  it("generates default palette tokens with 50-950 shades and dark mode shifts", () => {
    const css = generateThemeCSS();

    expect(css).toContain("/* @code-ui:theme */");
    expect(css).toContain("@theme default inline");

    // Primary (default: red)
    for (const shade of SHADES) {
      expect(css).toContain(
        `--color-primary-${shade}: var(--color-red-${shade}`,
      );
      expect(css).toContain(
        `--ui-color-primary-${shade}: var(--color-red-${shade}`,
      );
    }
    expect(css).toContain("--ui-primary: var(--ui-color-primary-500);");
    expect(css).toContain("--color-primary: var(--color-primary-500);");

    // Dark mode contrast shift
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain("--ui-primary: var(--ui-color-primary-400);");
    expect(css).toContain('page[data-theme="dark"], .dark');
  });

  it("handles custom palette keywords like blue and rose", () => {
    const css = generateThemeCSS({
      colors: {
        primary: "blue",
        danger: "rose",
      },
    });

    expect(css).toContain("--ui-color-primary-500: var(--color-blue-500");
    expect(css).toContain("--ui-color-danger-500: var(--color-rose-500");
  });

  it("handles custom @theme palette names like brand", () => {
    const css = generateThemeCSS({
      colors: {
        primary: "brand",
      },
    });

    expect(css).toContain("--ui-color-primary-500: var(--color-brand-500);");
    expect(css).toContain("--ui-primary: var(--ui-color-primary-500);");
    expect(css).toContain("--color-primary: var(--ui-primary);");
    expect(css).toContain("--color-brand: var(--color-brand-500);");
  });

  it("handles direct hex overrides without generating extra shades", () => {
    const css = generateThemeCSS({
      colors: {
        primary: "#000000",
      },
    });

    expect(css).toContain("--color-primary: #000000;");
    expect(css).not.toContain("--color-primary-500");
  });

  it("handles proportional radius scaling from base string", () => {
    const css = generateThemeCSS({
      radius: "8rpx",
    });

    expect(css).toContain("--ui-radius: 8rpx;");
    expect(css).toContain("--radius-xs: calc(var(--ui-radius) * 0.5);");
    expect(css).toContain("--radius-sm: var(--ui-radius);");
    expect(css).toContain("--radius-md: calc(var(--ui-radius) * 1.5);");
    expect(css).toContain("--radius-lg: calc(var(--ui-radius) * 2);");
    expect(css).toContain("--radius-xl: calc(var(--ui-radius) * 3);");
    expect(css).toContain("--radius-2xl: calc(var(--ui-radius) * 4);");
    expect(css).toContain("--radius-3xl: calc(var(--ui-radius) * 6);");
    expect(css).toContain("--radius-full: 9999px;");
  });

  it("handles base radius object with explicit overrides", () => {
    const css = generateThemeCSS({
      radius: {
        base: "8rpx",
        md: "14rpx", // override
      },
    });

    expect(css).toContain("--ui-radius: 8rpx;");
    expect(css).toContain("--radius-md: 14rpx;");
    expect(css).toContain("--radius-lg: calc(var(--ui-radius) * 2);");
  });

  it("handles explicit radius map without base", () => {
    const css = generateThemeCSS({
      radius: {
        md: "12rpx",
        lg: "16rpx",
      },
    });

    expect(css).not.toContain("--ui-radius:");
    expect(css).toContain("--radius-md: 12rpx;");
    expect(css).toContain("--radius-lg: 16rpx;");
  });

  it("generates warning and info palette tokens by default", () => {
    const css = generateThemeCSS();

    expect(css).toContain("--color-warning-500: var(--color-amber-500");
    expect(css).toContain("--ui-color-warning-500: var(--color-amber-500");
    expect(css).toContain("--color-info-500: var(--color-blue-500");
    expect(css).toContain("--ui-color-info-500: var(--color-blue-500");
  });
});

import { codeUI, compileComponentTheme } from "../src/index";
import { buttonTheme, drawerTheme } from "@code-ui/core";

describe("codeUI virtual themes", () => {
  it("compiles button theme with active colors and overrides", () => {
    const config = {
      prefix: "cui",
      ui: {
        colors: {
          brand: "#3b82f6",
        },
      },
      components: {
        button: {
          defaultVariants: {
            size: "lg" as any,
          },
        },
      },
    };

    const compiled = compileComponentTheme("button", buttonTheme, config);
    expect(compiled.variants.color).toHaveProperty("brand");
    expect(compiled.defaultVariants.size).toBe("lg");

    const brandCompound = compiled.compoundVariants?.find(
      (cv: any) => cv.color === "brand" && cv.variant === "solid",
    );
    expect(brandCompound?.class?.root).toContain("bg-brand");
  });

  it("replaces default colors when colorsMode is replace", () => {
    const config = {
      prefix: "cui",
      ui: {
        colors: {
          primary: "#3b82f6",
          danger: "#ef4444",
        },
        colorsMode: "replace" as const,
      },
    };

    const compiled = compileComponentTheme("button", buttonTheme, config);
    expect(Object.keys(compiled.variants.color)).toEqual(["primary", "danger"]);
    expect(
      compiled.compoundVariants?.every(
        (cv: any) => cv.color === "primary" || cv.color === "danger",
      ),
    ).toBe(true);
  });

  it("compiles drawer theme dynamically", () => {
    const config = {
      prefix: "cui",
      components: {
        drawer: {
          defaultVariants: {
            placement: "top" as any,
          },
        },
      },
    };

    const compiled = compileComponentTheme("drawer", drawerTheme, config);
    expect(compiled.slots).toHaveProperty("content");
    expect(compiled.defaultVariants.placement).toBe("top");
  });

  it("resolves virtual:cui/theme/<component> and loads pure theme object", () => {
    const plugin = codeUI({
      autoImport: false,
    });

    const resolvedButton = (plugin as any).resolveId(
      "virtual:cui/theme/button",
    );
    expect(resolvedButton).toBe("\0virtual:cui/theme/button");

    const loadedButton = (plugin as any).load("\0virtual:cui/theme/button");
    expect(loadedButton).toContain("export default {");
    expect(loadedButton).toContain('"solid"');
    expect(loadedButton).toContain('"primary"');

    const resolvedDrawer = (plugin as any).resolveId(
      "virtual:cui/theme/drawer",
    );
    expect(resolvedDrawer).toBe("\0virtual:cui/theme/drawer");

    const loadedDrawer = (plugin as any).load("\0virtual:cui/theme/drawer");
    expect(loadedDrawer).toContain("export default {");
    expect(loadedDrawer).toContain('"placement"');

    const loadedCard = (plugin as any).load("\0virtual:cui/theme/card");
    expect(loadedCard).toContain("export default {");
    expect(loadedCard).toContain('"header"');

    const loadedChip = (plugin as any).load("\0virtual:cui/theme/chip");
    expect(loadedChip).toContain("export default {");
    expect(loadedChip).toContain('"top-right"');

    const loadedPinInput = (plugin as any).load(
      "\0virtual:cui/theme/pin-input",
    );
    expect(loadedPinInput).toContain("export default {");
    expect(loadedPinInput).toContain('"separator"');
  });

  it("injects @plugin @egoist/tailwindcss-icons when enabled", () => {
    const configManager = new PluginConfigManager({
      icons: { autoPlugin: true },
    });
    const result = transformAppStyle(
      '@import "tailwindcss";',
      "/test/src/app.css",
      "/test",
      configManager,
      () => {},
    );
    expect(result).not.toBeNull();
    expect(result?.code).toContain('@plugin "@egoist/tailwindcss-icons";');
  });

  it("does not duplicate @plugin if already present in stylesheet", () => {
    const configManager = new PluginConfigManager({
      icons: { autoPlugin: true },
    });
    const existing =
      '@import "tailwindcss";\n@plugin "@egoist/tailwindcss-icons";';
    const result = transformAppStyle(
      existing,
      "/test/src/app.css",
      "/test",
      configManager,
      () => {},
    );
    // Should not contain a second @plugin directive
    const matches = result?.code.match(/@plugin "@egoist\/tailwindcss-icons"/g);
    expect(matches?.length).toBe(1);
  });

  it("collects used components from WXML tags and usingComponents", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cui-used-"));
    try {
      fs.mkdirSync(path.join(root, "pages"), { recursive: true });
      fs.writeFileSync(
        path.join(root, "pages/index.wxml"),
        "<c-button />\n<c-card></c-card>",
      );
      fs.writeFileSync(
        path.join(root, "app.json"),
        JSON.stringify({
          usingComponents: {
            "my-checkbox": "@code-ui/components/runtime/checkbox/index",
          },
        }),
      );

      const scan = collectUsedComponents(
        root,
        new Set(["button", "card", "checkbox"]),
      );
      expect(scan?.components).toEqual(new Set(["button", "card", "checkbox"]));
      expect(scan?.files).toHaveLength(2);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("matches multi-word components and resolves transitive dependencies like accordion and stepper", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cui-multi-"));
    try {
      fs.mkdirSync(path.join(root, "pages"), { recursive: true });
      fs.writeFileSync(
        path.join(root, "pages/index.wxml"),
        "<c-qr-code value='test' />\n<c-accordion />\n<c-stepper />\n<c-pin-input />",
      );

      const known = new Set([
        "accordion",
        "accordionItem",
        "stepper",
        "stepperItem",
        "qrCode",
        "pinInput",
        "icon",
      ]);

      const scan = collectUsedComponents(root, known);
      expect(scan?.components.has("qr-code")).toBe(true);
      expect(scan?.components.has("accordion")).toBe(true);
      expect(scan?.components.has("accordion-item")).toBe(true);
      expect(scan?.components.has("stepper")).toBe(true);
      expect(scan?.components.has("stepper-item")).toBe(true);
      expect(scan?.components.has("pin-input")).toBe(true);
      expect(scan?.components.has("icon")).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("includes qr-code, accordion, and stepper theme classes in stylesheet injection", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cui-styles-"));
    try {
      fs.mkdirSync(path.join(root, "pages"), { recursive: true });
      fs.writeFileSync(
        path.join(root, "pages/index.wxml"),
        "<c-qr-code value='https://code-ui.dev' />\n<c-accordion />\n<c-stepper />",
      );

      const configManager = new PluginConfigManager({});
      const result = transformAppStyle(
        '@import "tailwindcss";',
        path.join(root, "app.wxss"),
        root,
        configManager,
        () => {},
      );

      // qr-code theme classes
      expect(result?.code).toContain("w-40");
      expect(result?.code).toContain("h-40");

      // accordion-item theme classes (resolved via transitive dependency)
      expect(result?.code).toContain("select-none");

      // stepper-item separator classes (resolved via transitive dependency)
      expect(result?.code).toContain("pointer-events-none");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("falls back to all themes when dynamic component tags are present", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cui-used-"));
    try {
      fs.mkdirSync(path.join(root, "pages"), { recursive: true });
      fs.writeFileSync(
        path.join(root, "pages/index.wxml"),
        '<component is="{{tag}}" />',
      );

      expect(
        collectUsedComponents(root, new Set(["button", "card", "checkbox"])),
      ).toBeNull();
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("prunes unused component theme classes from the app stylesheet", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cui-used-"));
    try {
      fs.mkdirSync(path.join(root, "pages"), { recursive: true });
      fs.writeFileSync(
        path.join(root, "pages/index.wxml"),
        "<c-button /><c-card></c-card>",
      );

      const configManager = new PluginConfigManager({});
      const result = transformAppStyle(
        '@import "tailwindcss";',
        path.join(root, "app.wxss"),
        root,
        configManager,
        () => {},
      );

      expect(result?.code).toContain("inline-flex");
      expect(result?.code).not.toContain("resize-none");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("includes collection preset icon classes in @source inline directive", () => {
    const configManager = new PluginConfigManager({
      icons: {
        collections: ["tabler"],
        search: "i-tabler-search",
      },
    });
    const directive = configManager.getInlineThemeClassesDirective();
    expect(directive).toContain("i-tabler-check");
    expect(directive).toContain("i-tabler-minus");
    expect(directive).toContain("i-tabler-x");
    expect(directive).toContain("i-tabler-loader-2");
    expect(directive).toContain("i-tabler-search");
  });

  it("includes presets for multiple collections in @source inline directive", () => {
    const configManager = new PluginConfigManager({
      icons: {
        collections: ["lucide", "tabler"],
      },
    });
    const directive = configManager.getInlineThemeClassesDirective();
    expect(directive).toContain("i-lucide-check");
    expect(directive).toContain("i-lucide-loader-circle");
    expect(directive).toContain("i-tabler-check");
    expect(directive).toContain("i-tabler-loader-2");
  });

  it("resolves configured UI colors and Tailwind 500 shade fallbacks into virtual config code", () => {
    const configManager = new PluginConfigManager({
      ui: {
        colors: {
          primary: "stone",
          secondary: "#ff3366",
          brand: "rgb(239, 68, 68)",
        },
      },
    });

    const virtualCode = configManager.getVirtualConfigCode();
    expect(virtualCode).toContain('"stone": "#78716c"');
    expect(virtualCode).toContain('"primary": "stone"');
    expect(virtualCode).toContain('"secondary": "#ff3366"');
    expect(virtualCode).toContain('"brand": "rgb(239, 68, 68)"');
    expect(virtualCode).toContain('"success": "green"');
    expect(virtualCode).toContain('"green": "#22c55e"');
    expect(virtualCode).toContain('"warning": "amber"');
    expect(virtualCode).toContain('"amber": "#f59e0b"');
    expect(virtualCode).toContain('"info": "blue"');
    expect(virtualCode).toContain('"blue": "#3b82f6"');
    expect(virtualCode).toContain('"neutral": "zinc"');
    expect(virtualCode).toContain('"zinc": "#71717a"');
  });
});
