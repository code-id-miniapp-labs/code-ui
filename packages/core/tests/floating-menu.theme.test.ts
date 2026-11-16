import { describe, expect, it } from "vitest";
import { floatingMenuTheme } from "../src";

describe("floatingMenuTheme (@code-ui/core)", () => {
  it("provides all floating-menu anatomy slots", () => {
    const theme = floatingMenuTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("trigger");
    expect(theme.slots).toHaveProperty("backdrop");
    expect(theme.slots).toHaveProperty("positioner");
    expect(theme.slots).toHaveProperty("content");
    expect(theme.slots).toHaveProperty("arrow");
  });

  it("sets correct default variants", () => {
    const theme = floatingMenuTheme();
    expect(theme.defaultVariants).toEqual({
      portal: true,
      open: false,
      side: "bottom",
    });
  });

  it("supports portal and side variants", () => {
    const theme = floatingMenuTheme();
    expect(theme.variants.portal.true.positioner).toContain("fixed");
    expect(theme.variants.portal.false.positioner).toContain("absolute");
    expect(theme.variants.open.true.content).toContain("opacity-100");
    expect(theme.variants.open.false.content).toContain("opacity-0");
    expect(theme.variants.side.bottom.arrow).toContain("border-t");
    expect(theme.variants.side.top.arrow).toContain("border-b");
  });
});
