import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { actionSheetTheme as createActionSheetTheme } from "@code-id-labs/core";
import { tv } from "../src/utils/variants";
import { resolveSlots } from "../src/utils/ui";

const actionSheetTheme = tv(createActionSheetTheme());
const ACTION_SHEET_RUNTIME_DIR = resolve(
  __dirname,
  "../src/runtime/action-sheet",
);

describe("actionSheetTheme runtime resolution (@code-id-labs/components)", () => {
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
    expect(slots.content).toContain("w-full");
    expect(slots.content).not.toContain("md_cmax-w-");
    expect(slots.content).not.toContain("md_cmb-6");
    expect(slots.actions).toContain(
      "pb-_bcalc_pvar_p--spacing_P__x_3__u_env_psafe-area-inset-bottom_P_P_B",
    );
    expect(slots.actions).not.toContain("md_cpb-3");
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

  it("resolves disabled variant and avoids native WeChat disabled UA backgrounds", () => {
    const disabledSlots = resolveSlots(
      actionSheetTheme({ open: true, disabled: true }),
      {},
      "",
    );
    expect(disabledSlots.item).toContain("pointer-events-none");
    expect(disabledSlots.itemTitle).toContain("opacity-50");
    expect(disabledSlots.itemDescription).toContain("opacity-75");

    const wxml = readFileSync(
      resolve(ACTION_SHEET_RUNTIME_DIR, "index.wxml"),
      "utf8",
    );
    expect(wxml).toContain("disabledClasses.item");
    expect(wxml).toContain("disabledClasses.itemTitle");
    expect(wxml).toContain("disabledClasses.itemDescription");
    expect(wxml).toContain(
      'plain="{{item.openType && item.disabled ? true : false}}"',
    );
    expect(wxml).toContain(
      'disabled="{{item.openType ? item.disabled : false}}"',
    );
    expect(wxml).toContain(
      'data-disabled="{{item.disabled ? \'true\' : \'false\'}}"',
    );
  });
});
