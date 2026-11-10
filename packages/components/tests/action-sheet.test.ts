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
    expect(slots.cancel).toContain("cursor-pointer");
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

  it("supports custom slot overrides via ui prop", () => {
    const slots = resolveSlots(
      actionSheetTheme({ open: true }),
      {
        content: "custom-content-class",
        cancel: "custom-cancel-class",
      },
      "custom-root-class",
    );

    expect(slots.root).toContain("custom-root-class");
    expect(slots.content).toContain("custom-content-class");
    expect(slots.cancel).toContain("custom-cancel-class");
  });
});
