import { describe, expect, it } from "vitest";
import { actionSheetTheme as createActionSheetTheme } from "@code-ui/core";
import { tv } from "../src/utils/variants";
import { resolveSlots } from "../src/utils/ui";

const actionSheetTheme = tv(createActionSheetTheme());

describe("actionSheetTheme runtime resolution (@code-ui/components)", () => {
  it("resolves default slots correctly when closed", () => {
    const slots = resolveSlots(
      actionSheetTheme({
        open: false,
      }),
      {},
      "",
    );

    expect(slots.root).toContain("fixed inset-0");
    expect(slots.root).toContain("items-end");
    expect(slots.backdrop).toContain("opacity-0 pointer-events-none");
    expect(slots.content).toContain("translate-y-full");
    expect(slots.actions).toContain("flex items-center");
  });

  it("resolves open slots correctly", () => {
    const slots = resolveSlots(
      actionSheetTheme({
        open: true,
      }),
      {},
      "",
    );

    expect(slots.backdrop).toContain("opacity-100 pointer-events-auto");
    expect(slots.content).toContain("translate-y-0");
  });

  it("resolves centered item text and layout slots by default", () => {
    const slots = resolveSlots(
      actionSheetTheme({
        open: true,
      }),
      {},
      "",
    );

    expect(slots.item).toContain("justify-center");
    expect(slots.itemText).toContain("items-center");
    expect(slots.itemText).toContain("text-center");
    expect(slots.itemTitle).toContain("justify-center");
    expect(slots.itemLabel).toContain("text-center");
    expect(slots.header).toContain("text-center");
    expect(slots.title).toContain("text-center");
    expect(slots.description).toContain("text-center");
    expect(slots.actions).toContain("justify-center");
  });

  it("supports custom slot overrides via ui prop", () => {
    const slots = resolveSlots(
      actionSheetTheme({ open: true }),
      {
        content: "custom-content-class",
        actions: "custom-actions-class",
      },
      "custom-root-class",
    );

    expect(slots.root).toContain("custom-root-class");
    expect(slots.content).toContain("custom-content-class");
    expect(slots.actions).toContain("custom-actions-class");
  });
});
