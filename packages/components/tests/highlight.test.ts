import { describe, expect, it } from "vitest";
import { highlightTheme } from "@code-id-labs/core";
import { highlightWords } from "../src/runtime/highlight/utils";
import { resolveSlots } from "../src/utils/ui";
import { tv } from "../src/utils/variants";

describe("highlightWords", () => {
  it("returns empty array for empty text and single unmatched chunk for empty query", () => {
    expect(highlightWords("", "foo")).toEqual([]);
    expect(highlightWords(null, "foo")).toEqual([]);
    expect(highlightWords("Hello world", "")).toEqual([
      { text: "Hello world", match: false },
    ]);
    expect(highlightWords("Hello world", [])).toEqual([
      { text: "Hello world", match: false },
    ]);
  });

  it("highlights a single substring case-insensitively by default", () => {
    expect(
      highlightWords(
        "With the Highlight component, you can spotlight words.",
        "highlight",
      ),
    ).toEqual([
      { text: "With the ", match: false },
      { text: "Highlight", match: true },
      { text: " component, you can spotlight words.", match: false },
    ]);
  });

  it("highlights multiple queries and prioritizes longer overlapping terms", () => {
    expect(
      highlightWords("Spotlight the spot in your search", [
        "spot",
        "spotlight",
        "search",
      ]),
    ).toEqual([
      { text: "Spotlight", match: true },
      { text: " the ", match: false },
      { text: "spot", match: true },
      { text: " in your ", match: false },
      { text: "search", match: true },
    ]);
  });

  it("respects ignoreCase=false and matchAll=false", () => {
    expect(
      highlightWords("Code code CODE", "code", { ignoreCase: false }),
    ).toEqual([
      { text: "Code ", match: false },
      { text: "code", match: true },
      { text: " CODE", match: false },
    ]);

    expect(
      highlightWords("go go go", "go", { matchAll: false }),
    ).toEqual([
      { text: "go", match: true },
      { text: " go go", match: false },
    ]);
  });

  it("supports exactMatch whole-word boundaries", () => {
    expect(
      highlightWords("Highlight the light in sunlight", "light", {
        exactMatch: true,
      }),
    ).toEqual([
      { text: "Highlight the ", match: false },
      { text: "light", match: true },
      { text: " in sunlight", match: false },
    ]);
  });

  it("safely escapes RegExp special characters", () => {
    expect(
      highlightWords("Save $100 with C++ [v2.0]", ["$100", "C++", "[v2.0]"]),
    ).toEqual([
      { text: "Save ", match: false },
      { text: "$100", match: true },
      { text: " with ", match: false },
      { text: "C++", match: true },
      { text: " ", match: false },
      { text: "[v2.0]", match: true },
    ]);
  });
});

describe("highlightTheme", () => {
  const compiled = tv({ name: "highlight", ...highlightTheme() });

  it("resolves default soft primary rounded classes", () => {
    const slots = resolveSlots(compiled());
    expect(slots.root).toContain("inline");
    expect(slots.mark).toContain("bg-primary_f15");
    expect(slots.mark).toContain("text-primary");
    expect(slots.mark).toContain("rounded-sm");
  });

  it("resolves solid, subtle, outline, text variants and neutral color", () => {
    const solid = resolveSlots(compiled({ color: "success", variant: "solid" }));
    expect(solid.mark).toContain("bg-success");
    expect(solid.mark).toContain("text-white");

    const subtle = resolveSlots(
      compiled({ color: "warning", variant: "subtle" }),
    );
    expect(subtle.mark).toContain("bg-warning_f10");
    expect(subtle.mark).toContain("text-warning");
    expect(subtle.mark).toContain("ring-1");

    const outline = resolveSlots(
      compiled({ color: "danger", variant: "outline" }),
    );
    expect(outline.mark).toContain("border-danger");
    expect(outline.mark).toContain("text-danger");

    const textOnly = resolveSlots(
      compiled({ color: "info", variant: "text", rounded: false }),
    );
    expect(textOnly.mark).toContain("text-info");
    expect(textOnly.mark).toContain("rounded-none");

    const neutral = resolveSlots(
      compiled({ color: "neutral", variant: "soft" }),
    );
    expect(neutral.mark).toContain("bg-accented");
    expect(neutral.mark).toContain("text-highlighted");
  });

  it("supports size variant and per-instance ui / className overrides", () => {
    const slots = resolveSlots(
      compiled({ size: "lg", color: "warning", variant: "soft" }),
      { mark: "rounded-full px-2 font-bold" },
      "block mt-2",
    );
    expect(slots.root).toContain("text-lg");
    expect(slots.root).toContain("block");
    expect(slots.mark).toContain("rounded-full");
    expect(slots.mark).not.toContain("rounded-sm");
    expect(slots.mark).toContain("px-2");
    expect(slots.mark).toContain("font-bold");
  });
});
