import { describe, expect, it } from "vitest";
import { drawerTheme } from "../src";

describe("drawerTheme (@code-id-labs/core)", () => {
  it("keeps top and bottom placements full-width while constraining side drawers", () => {
    const theme = drawerTheme();

    expect(theme.slots.headerContent).toContain("min-w-0");
    expect(theme.slots.footer).toContain(
      "pb-[calc(var(--spacing)_*_3_+_env(safe-area-inset-bottom))]",
    );
    expect(theme.slots.footer).not.toContain("0.75rem");

    expect(theme.variants.placement.bottom.content).toContain("w-full");
    expect(theme.variants.placement.bottom.content).not.toContain("md:max-w-");
    expect(theme.variants.placement.top.content).toContain("w-full");
    expect(theme.variants.placement.top.content).not.toContain("md:max-w-");

    expect(theme.variants.placement.left.content).toContain("md:max-w-md");
    expect(theme.variants.placement.right.content).toContain("md:max-w-md");

    expect(theme.variants.placement.bottom.grabberBar).toContain("w-12 h-1.5");
    expect(theme.variants.placement.top.grabberBar).toContain("w-12 h-1.5");
    expect(theme.variants.placement.left.grabberBar).toContain("w-1.5 h-12");
    expect(theme.variants.placement.right.grabberBar).toContain("w-1.5 h-12");
    expect(theme.variants.placement.left.body).toContain("h-0");
    expect(theme.variants.placement.right.body).toContain("h-0");
    expect(theme.variants.placement.bottom.container).toContain("flex-initial");
    expect(theme.variants.placement.bottom.container).not.toContain("flex-1");
    expect(theme.variants.placement.bottom.body).toContain("max-h-[60vh]");
    expect(theme.variants.placement.top.container).toContain("flex-initial");
    expect(theme.variants.placement.top.body).toContain("max-h-[60vh]");
    expect(theme.variants.keyboardOpen.true.footer).toContain("pb-3");
    expect(theme.defaultVariants.keyboardOpen).toBe(false);
  });
});
