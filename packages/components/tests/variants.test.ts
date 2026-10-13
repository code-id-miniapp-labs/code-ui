import { describe, expect, it } from "vitest";
import { resetConfig, setConfig } from "@code-ui/core";
import { buttonTheme } from "../src/runtime/button/theme";
import { cn, dedupeClasses, escapeClass } from "../src/runtime/utils/variants";
import {
  clearThemeCache,
  getResolvedTheme,
  resolveSlots,
} from "../src/runtime/utils/ui";

describe("escapeClass", () => {
  it("leaves safe classes untouched", () => {
    expect(escapeClass("flex items-center bg-emerald-600")).toBe(
      "flex items-center bg-emerald-600",
    );
  });

  it("escapes arbitrary values, variants and fractions", () => {
    const out = escapeClass("w-[10px] active:bg-red-500 w-1/2 text-[#fff]");
    expect(out).not.toMatch(/[[\]:/#]/);
    expect(out.split(" ")).toHaveLength(4);
  });

  it("applies head rules per class, not only to the first class", () => {
    const out = escapeClass("flex 2xl:flex");
    expect(out.split(" ")[1]).toBe(escapeClass("2xl:flex"));
    expect(out.split(" ")[1]).not.toMatch(/^2/);
  });

  it("normalizes whitespace and empty values", () => {
    expect(escapeClass("  a   b ")).toBe("a b");
    expect(escapeClass(undefined)).toBe("");
    expect(escapeClass("")).toBe("");
  });

  it("is idempotent for already escaped classes", () => {
    const input = "w-[10px] 2xl:flex hover:bg-[#fff] w-1/2 -mt-2 -1";
    const once = escapeClass(input);
    expect(escapeClass(once)).toBe(once);
  });

  it("stays correct after the token cache evicts entries", () => {
    const expected = escapeClass("w-[1px]");
    for (let i = 0; i < 600; i++) escapeClass(`w-[${i}px]`);
    expect(escapeClass("w-[1px]")).toBe(expected);
  });
});

describe("cn", () => {
  it("joins clsx-style values and escapes", () => {
    const out = cn("a", false, ["b", { c: true, d: false }], "w-[1px]");
    expect(out.split(" ").slice(0, 3)).toEqual(["a", "b", "c"]);
    expect(out).not.toMatch(/[[\]]/);
  });
});

describe("resolveSlots + buttonTheme", () => {
  it("keeps compound variants and appends escaped user overrides", () => {
    const slots = resolveSlots(
      buttonTheme({ variant: "solid", color: "primary", size: "md" }) as any,
      { root: "w-[100px] hover:opacity-90" },
      "mt-2",
    );
    expect(slots.root).toContain("bg-primary");
    expect(slots.root).toContain("h-9");
    expect(slots.root).toContain("mt-2");
    expect(slots.root).not.toMatch(/[[\]:]/);
  });

  it("replaces default radius and text color when localClass or ui overrides them", () => {
    // buttonTheme size "md" defaults to rounded-lg
    const slotsWithRoundedFull = resolveSlots(
      buttonTheme({ variant: "solid", color: "primary", size: "md" }) as any,
      undefined,
      "rounded-full text-blue-500",
    );
    expect(slotsWithRoundedFull.root).toContain("rounded-full");
    expect(slotsWithRoundedFull.root).not.toContain("rounded-lg");
    expect(slotsWithRoundedFull.root).toContain("text-blue-500");
    expect(slotsWithRoundedFull.root).not.toContain("text-white");

    const slotsWithRoundedSm = resolveSlots(
      buttonTheme({ variant: "solid", color: "primary", size: "md" }) as any,
      { root: "rounded-sm" },
    );
    expect(slotsWithRoundedSm.root).toContain("rounded-sm");
    expect(slotsWithRoundedSm.root).not.toContain("rounded-lg");
  });
});

describe("getResolvedTheme", () => {
  it("picks up a changed global config without clearing the cache manually", () => {
    clearThemeCache();
    const rootOf = () =>
      resolveSlots(
        getResolvedTheme("button", buttonTheme)({ variant: "solid" }) as any,
      ).root;

    setConfig({ components: { button: { slots: { root: "first-override" } } } });
    expect(rootOf()).toContain("first-override");

    // Simulates the virtual config module re-executing after an HMR update.
    setConfig({ components: { button: { slots: { root: "second-override" } } } });
    const next = rootOf();
    expect(next).toContain("second-override");
    expect(next).not.toContain("first-override");

    resetConfig();
    clearThemeCache();
  });

  it("allows global slot overrides in cui.config.ts to replace conflicting compoundVariant classes", () => {
    clearThemeCache();
    setConfig({
      components: {
        button: {
          slots: {
            root: "shadow-sm text-red-500",
          },
        },
      },
    });

    const theme = getResolvedTheme("button", buttonTheme);
    const resolved = resolveSlots(theme({ variant: "solid", color: "primary" }) as any);

    // text-red-500 must replace text-white!
    expect(resolved.root).toContain("text-red-500");
    expect(resolved.root).not.toContain("text-white");
    expect(resolved.root).toContain("bg-primary");

    resetConfig();
    clearThemeCache();
  });
});

describe("dedupeClasses", () => {
  it("drops earlier conflicting color and background classes", () => {
    expect(dedupeClasses("bg-emerald-600 text-white", "text-red-500")).toBe(
      "bg-emerald-600 text-red-500",
    );
    expect(dedupeClasses("bg-emerald-600 text-white", "bg-black text-red-500")).toBe(
      "bg-black text-red-500",
    );
  });

  it("drops earlier padding and margin classes", () => {
    expect(dedupeClasses("px-4 py-2", "px-6")).toBe("py-2 px-6");
    expect(dedupeClasses("m-2", "m-4")).toBe("m-4");
  });

  it("drops earlier rounded and shadow classes", () => {
    expect(dedupeClasses("rounded-md shadow-sm", "rounded-full shadow-2xl")).toBe(
      "rounded-full shadow-2xl",
    );
    expect(dedupeClasses("rounded-lg", "rounded-full")).toBe("rounded-full");
    expect(dedupeClasses("rounded-md", "rounded-sm")).toBe("rounded-sm");
    expect(dedupeClasses("rounded-none", "rounded-xl")).toBe("rounded-xl");
    expect(dedupeClasses("rounded-t-sm", "rounded-t-lg")).toBe("rounded-t-lg");
  });

  it("handles modifier variants independently", () => {
    expect(dedupeClasses("active:bg-emerald-700 bg-emerald-600", "bg-black active:bg-neutral-800")).toBe(
      "bg-black active:bg-neutral-800",
    );
  });
});

