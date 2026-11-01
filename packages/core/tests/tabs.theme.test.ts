import { describe, expect, it } from "vitest";
import { tabsTheme } from "../src";

describe("tabsTheme (@code-ui/core)", () => {
  it("provides all tabs container anatomy slots", () => {
    const theme = tabsTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("list");
    expect(theme.slots).toHaveProperty("content");
    expect(theme.slots).not.toHaveProperty("indicator");
  });

  it("sets correct default variants", () => {
    const theme = tabsTheme();
    expect(theme.defaultVariants).toEqual({
      variant: "pill",
      orientation: "horizontal",
      size: "md",
      disabled: false,
      fitted: false,
    });
  });

  it("supports variant styles for pill and link", () => {
    const theme = tabsTheme();
    expect(theme.variants.variant.pill).toBeDefined();
    expect(theme.variants.variant.link).toBeDefined();
    expect(theme.variants.variant.pill.list).toContain("bg-neutral-100");
    expect(theme.variants.variant.link.list).toContain("border-b");
  });

  it("supports orientation styles", () => {
    const theme = tabsTheme();
    expect(theme.variants.orientation.horizontal.root).toContain("flex-col");
    expect(theme.variants.orientation.vertical.root).toContain("flex-row");
  });

  it("supports size variants", () => {
    const theme = tabsTheme();
    expect(theme.variants.size.xs).toBeDefined();
    expect(theme.variants.size.sm).toBeDefined();
    expect(theme.variants.size.md).toBeDefined();
    expect(theme.variants.size.lg).toBeDefined();
    expect(theme.variants.size.xl).toBeDefined();
  });
});

