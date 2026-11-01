import { describe, expect, it } from "vitest";
import { tabsItemTheme } from "../src";

describe("tabsItemTheme (@code-ui/core)", () => {
  it("provides root and content slots", () => {
    const theme = tabsItemTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("content");
  });

  it("sets correct default variants", () => {
    const theme = tabsItemTheme();
    expect(theme.defaultVariants).toEqual({
      disabled: false,
    });
  });

  it("supports disabled variant", () => {
    const theme = tabsItemTheme();
    expect(theme.variants.disabled.true.root).toContain("opacity-50");
  });
});
