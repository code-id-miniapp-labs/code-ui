import { describe, expect, it } from "vitest";
import { tabsItemTheme } from "../src";

describe("tabsItemTheme (@code-ui/core)", () => {
  it("provides all tabs-item anatomy slots", () => {
    const theme = tabsItemTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("content");
    expect(theme.slots).toHaveProperty("trigger");
    expect(theme.slots).toHaveProperty("leading");
    expect(theme.slots).toHaveProperty("label");
    expect(theme.slots).toHaveProperty("trailing");
    expect(theme.slots).toHaveProperty("indicator");
  });

  it("sets correct default variants", () => {
    const theme = tabsItemTheme();
    expect(theme.defaultVariants).toEqual({
      color: "primary",
      variant: "pill",
      orientation: "horizontal",
      size: "md",
      disabled: false,
      selected: false,
      fitted: false,
    });
  });

  it("supports disabled variant", () => {
    const theme = tabsItemTheme();
    expect(theme.variants.disabled.true.root).toContain("opacity-50");
  });

  it("includes transition and animation classes on indicator", () => {
    const theme = tabsItemTheme();
    expect(theme.slots.indicator).toContain("transition-all");
    expect(theme.variants.selected.true.indicator).toContain("opacity-100");
    expect(theme.variants.selected.false.indicator).toContain("opacity-0");
  });
});
