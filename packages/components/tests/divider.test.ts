import { describe, expect, it } from "vitest";
import { dividerTheme as createDividerTheme } from "@code-ui/core";
import { tv } from "../src/utils/variants";
import { resolveSlots } from "../src/utils/ui";

const dividerTheme = tv(createDividerTheme());

describe("dividerTheme runtime resolution (@code-ui/components)", () => {
  it("resolves default horizontal divider slots", () => {
    const theme = dividerTheme();
    const slots = resolveSlots(theme, {}, "");

    expect(slots.root).toContain("flex items-center");
    expect(slots.root).toContain("w-full");
    expect(slots.root).toContain("flex-row");

    expect(slots.border).toContain("flex-1");
    expect(slots.border).toContain("border-t");
    expect(slots.border).toContain("border-solid");
    expect(slots.border).toContain("border-neutral");

    expect(slots.container).toContain("mx-3");
    expect(slots.container).toContain("text-_b10px_B");
  });

  it("resolves vertical divider with h-full and flex-col", () => {
    const theme = dividerTheme({ orientation: "vertical" });
    const slots = resolveSlots(theme, {}, "");

    expect(slots.root).toContain("flex items-center");
    expect(slots.root).toContain("h-full");
    expect(slots.root).toContain("flex-col");
    expect(slots.root).not.toContain("w-full");

    expect(slots.border).toContain("flex-1");
    expect(slots.border).toContain("border-s");
    expect(slots.border).toContain("border-t-0");
    expect(slots.border).toContain("border-solid");
    expect(slots.border).toContain("border-neutral");

    expect(slots.container).toContain("my-2");
  });

  it("resolves position variants (start, center, end) for both orientations", () => {
    const hStart = resolveSlots(dividerTheme({ position: "start" }), {}, "");
    expect(hStart.container).toContain("me-3");

    const hEnd = resolveSlots(dividerTheme({ position: "end" }), {}, "");
    expect(hEnd.container).toContain("ms-3");

    const vStart = resolveSlots(
      dividerTheme({ orientation: "vertical", position: "start" }),
      {},
      "",
    );
    expect(vStart.container).toContain("mb-2");

    const vEnd = resolveSlots(
      dividerTheme({ orientation: "vertical", position: "end" }),
      {},
      "",
    );
    expect(vEnd.container).toContain("mt-2");
  });

  it("resolves size scaling for borders and container typography", () => {
    const sm = resolveSlots(dividerTheme({ size: "sm" }), {}, "");
    expect(sm.container).toContain("text-xs");
    expect(sm.border).toContain("border-t-_b2px_B");

    const lg = resolveSlots(dividerTheme({ size: "lg" }), {}, "");
    expect(lg.container).toContain("text-base");
    expect(lg.border).toContain("border-t-_b4px_B");

    const vLg = resolveSlots(
      dividerTheme({ orientation: "vertical", size: "lg" }),
      {},
      "",
    );
    expect(vLg.border).toContain("border-s-_b4px_B");
  });

  it("resolves border line types (dashed, dotted)", () => {
    const dashed = resolveSlots(dividerTheme({ type: "dashed" }), {}, "");
    expect(dashed.border).toContain("border-dashed");

    const dotted = resolveSlots(dividerTheme({ type: "dotted" }), {}, "");
    expect(dotted.border).toContain("border-dotted");
  });

  it("resolves colors properly", () => {
    const primary = resolveSlots(dividerTheme({ color: "primary" }), {}, "");
    expect(primary.border).toContain("border-primary");

    const success = resolveSlots(dividerTheme({ color: "success" }), {}, "");
    expect(success.border).toContain("border-success");
  });

  it("merges custom root classes and ui slot overrides", () => {
    const slots = resolveSlots(
      dividerTheme({ orientation: "vertical" }),
      {
        root: "opacity-80",
        border: "border-primary",
      },
      "custom-root-class",
    );

    expect(slots.root).toContain("h-full");
    expect(slots.root).toContain("flex-col");
    expect(slots.root).toContain("opacity-80");
    expect(slots.root).toContain("custom-root-class");
    expect(slots.border).toContain("border-primary");
  });
});
