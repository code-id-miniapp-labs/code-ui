import { describe, expect, it } from "vitest";
import { generateThemeCSS, SHADES } from "../src/core/theme";

describe("generateThemeCSS", () => {
  it("generates default palette tokens with 50-950 shades and dark mode shifts", () => {
    const css = generateThemeCSS();

    expect(css).toContain("/* @code-ui:theme */");
    expect(css).toContain("@theme default inline");

    // Primary (default: emerald)
    for (const shade of SHADES) {
      expect(css).toContain(
        `--color-primary-${shade}: var(--ui-color-primary-${shade});`,
      );
      expect(css).toContain(
        `--ui-color-primary-${shade}: var(--color-emerald-${shade}`,
      );
    }
    expect(css).toContain("--ui-primary: var(--ui-color-primary-500);");
    expect(css).toContain("--color-primary: var(--ui-primary);");

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
});
