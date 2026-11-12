import { describe, expect, it } from "vitest";
import { actionSheetTheme } from "../src";

describe("actionSheetTheme (@code-ui/core)", () => {
  it("provides all required slots", () => {
    const theme = actionSheetTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("backdrop");
    expect(theme.slots).toHaveProperty("content");
    expect(theme.slots).toHaveProperty("header");
    expect(theme.slots).toHaveProperty("title");
    expect(theme.slots).toHaveProperty("description");
    expect(theme.slots).toHaveProperty("closeTrigger");
    expect(theme.slots).toHaveProperty("body");
    expect(theme.slots).toHaveProperty("item");
    expect(theme.slots).toHaveProperty("itemText");
    expect(theme.slots).toHaveProperty("itemTitle");
    expect(theme.slots).toHaveProperty("itemLabel");
    expect(theme.slots).toHaveProperty("itemDescription");
    expect(theme.slots).toHaveProperty("itemIcon");
    expect(theme.slots).toHaveProperty("gap");
    expect(theme.slots).toHaveProperty("actions");
    expect(theme.slots).toHaveProperty("action");
  });

  it("sets correct default variants", () => {
    const theme = actionSheetTheme();
    expect(theme.defaultVariants).toEqual({
      open: false,
    });
  });

  it("configures open and closed variants", () => {
    const theme = actionSheetTheme();
    expect(theme.variants.open.true.backdrop).toContain("opacity-100");
    expect(theme.variants.open.false.backdrop).toContain("opacity-0");

    const openCompound = theme.compoundVariants?.find((cv) => cv.open === true);
    expect(openCompound?.class?.content).toContain("translate-y-0");

    const closedCompound = theme.compoundVariants?.find((cv) => cv.open === false);
    expect(closedCompound?.class?.content).toContain("translate-y-full");
  });
});
