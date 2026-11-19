import { describe, expect, it } from "vitest";
import { appTheme } from "../src";

describe("appTheme (@code-id-labs/core)", () => {
  it("uses GPU-friendly origin-top transform without full-page mask or layout transitions", () => {
    const theme = appTheme();

    expect(theme.slots.root).toContain("transition-colors");
    expect(theme.slots.root).not.toContain("transition-[padding");

    expect(theme.slots.scaleWrapper).toContain("origin-top");
    expect(theme.slots.scaleWrapper).not.toContain("transform-origin-top");
    expect(theme.slots.scaleWrapper).toContain("transition-transform");

    expect(theme.variants.scaled.true.root).toContain("bg-black");
    expect(theme.variants.scaled.true.scaleWrapper).not.toContain("overflow-hidden");
    expect(theme.variants.scaled.true.scaleWrapper).not.toContain("rounded-md");
    expect(theme.variants.scaled.true.scaleWrapper).not.toContain("will-change");
  });
});
