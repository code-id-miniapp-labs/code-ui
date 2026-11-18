import { describe, expect, it } from "vitest";
import { popoverTheme } from "../src";

describe("popoverTheme (@code-ui/core)", () => {
  it("provides all popover anatomy slots", () => {
    const theme = popoverTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("trigger");
    expect(theme.slots).toHaveProperty("backdrop");
    expect(theme.slots).toHaveProperty("positioner");
    expect(theme.slots).toHaveProperty("content");
    expect(theme.slots).toHaveProperty("body");
    expect(theme.slots).toHaveProperty("arrow");
  });

  it("sets correct default variants", () => {
    const theme = popoverTheme();
    expect(theme.defaultVariants).toEqual({
      portal: false,
      block: false,
      open: false,
      visible: false,
      side: "bottom",
    });
  });

  it("supports portal, block, visible, and side variants", () => {
    const theme = popoverTheme();
    expect(theme.variants.portal.true.positioner).toContain("fixed");
    expect(theme.variants.portal.false.positioner).toContain("absolute");
    expect(theme.variants.block.true.root).toContain("w-full");
    expect(theme.variants.block.false.root).toContain("w-fit");
    expect(theme.variants.visible.true.root).toContain("z-50");
    expect(theme.variants.visible.true.trigger).toContain("z-50");
    expect(theme.variants.open.true.content).toContain("opacity-100");
    expect(theme.variants.open.false.content).toContain("opacity-0");
    expect(theme.variants.side.bottom.arrow).toContain("border-t");
    expect(theme.variants.side.top.arrow).toContain("border-b");
  });
});
