import { describe, expect, it } from "vitest";
import bannerTheme from "../src/theme/definitions/banner";

describe("bannerTheme", () => {
  it("resolves default slots and variants", () => {
    const theme = bannerTheme();
    expect(theme.slots).toBeDefined();
    expect(theme.slots.root).toContain("w-full");
    expect(theme.slots.background).toBeDefined();
    expect(theme.slots.body).toBeDefined();
    expect(theme.slots.content).toBeDefined();
    expect(theme.slots.title).toBeDefined();
    expect(theme.slots.description).toBeDefined();
    expect(theme.slots.caption).toBeDefined();
    expect(theme.slots.badge).toBeDefined();
    expect(theme.slots.imageArea).toBeDefined();
    expect(theme.slots.image).toBeDefined();
    expect(theme.slots.icon).toBeDefined();
    expect(theme.slots.buttonArea).toBeDefined();
    expect(theme.slots.close).toBeDefined();
    expect(theme.slots.more).toBeDefined();
    expect(theme.slots.actions).toBeDefined();
    expect(theme.slots.action).toBeDefined();
    expect(theme.defaultVariants?.color).toBe("primary");
    expect(theme.defaultVariants?.variant).toBe("solid");
    expect(theme.defaultVariants?.size).toBe("md");
  });

  it("includes placement, mode, size and image variants", () => {
    const theme = bannerTheme();
    expect(theme.variants.placement.top).toBeDefined();
    expect(theme.variants.placement.bottom).toBeDefined();
    expect(theme.variants.placement.inline).toBeDefined();
    expect(theme.variants.mode.fixed).toBeDefined();
    expect(theme.variants.mode.inline).toBeDefined();
    expect(theme.variants.size.xs).toBeDefined();
    expect(theme.variants.size.sm).toBeDefined();
    expect(theme.variants.size.md).toBeDefined();
    expect(theme.variants.size.lg).toBeDefined();
    expect(theme.variants.size.xl).toBeDefined();
    expect(theme.variants.imagePosition.left).toBeDefined();
    expect(theme.variants.imagePosition.right).toBeDefined();
    expect(theme.variants.imagePosition.background).toBeDefined();
    expect(theme.variants.imageShape.square).toBeDefined();
    expect(theme.variants.imageShape.rect).toBeDefined();
    expect(theme.variants.imageShape.full).toBeDefined();
  });

  it("uses py and px for size variants without height constraints", () => {
    const theme = bannerTheme();
    for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
      const bgClasses = theme.variants.size[size].background;
      expect(bgClasses).toMatch(/py-\d+/);
      expect(bgClasses).toMatch(/px-\d+/);
      expect(bgClasses).not.toContain("min-h");
      expect(bgClasses).not.toMatch(/\bh-\d+/);
    }
    expect(theme.slots.background).not.toContain("min-h");
    expect(theme.slots.background).not.toMatch(/\bh-\d+/);
  });

  it("uses divide-x and divide-* classes on actions for vertical separation", () => {
    const theme = bannerTheme();
    expect(theme.slots.actions).toContain("divide-x");
    expect(theme.slots.actions).toContain("border-t");

    const cv = theme.compoundVariants?.[0] as any;
    expect(cv?.class?.actions).toContain("divide-");
  });
});
