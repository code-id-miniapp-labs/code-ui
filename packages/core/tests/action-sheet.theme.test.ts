import { describe, expect, it } from "vitest";
import { actionSheetTheme } from "../src";

describe("actionSheetTheme (@code-id-labs/core)", () => {
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
      disabled: false,
      closable: false,
    });
  });

  it("configures open and closed variants", () => {
    const theme = actionSheetTheme();
    expect(theme.variants.open.true.backdrop).toContain("opacity-100");
    expect(theme.variants.open.false.backdrop).toContain("opacity-0");

    const openCompound = theme.compoundVariants?.find((cv) => cv.open === true);
    expect(openCompound?.class?.content).toContain("translate-y-0");

    const closedCompound = theme.compoundVariants?.find(
      (cv) => cv.open === false,
    );
    expect(closedCompound?.class?.content).toContain("translate-y-full");
  });

  it("configures disabled variants without relying on native :disabled pseudo-classes", () => {
    const theme = actionSheetTheme();
    expect(theme.slots.item).not.toContain("disabled:");
    expect(theme.variants.disabled.true.item).toContain("pointer-events-none");
    expect(theme.variants.disabled.true.itemTitle).toContain("opacity-50");
    expect(theme.variants.disabled.true.itemDescription).toContain("opacity-75");
    expect(theme.variants.disabled.false).toEqual({});
  });

  it("reserves symmetric header clearance when closable to avoid closeTrigger overlap", () => {
    const theme = actionSheetTheme();
    expect(theme.slots.header).toContain("px-6");
    expect(theme.slots.title).toContain("break-words");
    expect(theme.slots.description).toContain("break-words");
    expect(theme.slots.closeTrigger).toContain("z-10");
    expect(theme.variants.closable.true.header).toContain("px-14");
    expect(theme.variants.closable.true.header).toContain("min-h-14");
    expect(theme.variants.closable.false).toEqual({});
  });
});
