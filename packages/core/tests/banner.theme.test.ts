import { describe, expect, it } from "vitest";
import bannerTheme from "../src/theme/definitions/banner";

describe("bannerTheme", () => {
  it("resolves default slots and variants", () => {
    const theme = bannerTheme();
    expect(theme.slots).toBeDefined();
    expect(theme.slots.root).toContain("w-full");
    expect(theme.slots.wrapper).toBeDefined();
    expect(theme.slots.title).toBeDefined();
    expect(theme.slots.description).toBeDefined();
    expect(theme.slots.closeTrigger).toBeDefined();
    expect(theme.defaultVariants?.color).toBe("primary");
    expect(theme.defaultVariants?.variant).toBe("soft");
  });

  it("includes placement and mode variants", () => {
    const theme = bannerTheme();
    expect(theme.variants.placement.top).toBeDefined();
    expect(theme.variants.placement.bottom).toBeDefined();
    expect(theme.variants.placement.inline).toBeDefined();
    expect(theme.variants.mode.fixed).toBeDefined();
    expect(theme.variants.mode.inline).toBeDefined();
  });
});

