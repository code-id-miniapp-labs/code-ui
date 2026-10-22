import { describe, expect, it } from "vitest";
import {
  buttonTheme as createButtonTheme,
  switchTheme as createSwitchTheme,
  inputTheme as createInputTheme,
  pinInputTheme as createPinInputTheme,
  radioTheme as createRadioTheme,
  radioGroupTheme as createRadioGroupTheme,
  checkboxTheme as createCheckboxTheme,
  checkboxGroupTheme as createCheckboxGroupTheme,
  iconTheme as createIconTheme,
  textareaTheme as createTextareaTheme,
  resetConfig,
  setConfig,
  avatarTheme as createAvatarTheme,
} from "@code-ui/core";
import { cn, dedupeClasses, escapeClass, tv } from "../src/utils/variants";

const buttonTheme = tv(createButtonTheme());
const radioTheme = tv(createRadioTheme());
const radioGroupTheme = tv(createRadioGroupTheme());
const checkboxTheme = tv(createCheckboxTheme());
const checkboxGroupTheme = tv(createCheckboxGroupTheme());
const iconTheme = tv(createIconTheme());
const avatarTheme = tv(createAvatarTheme());
import {
  clearThemeCache,
  getResolvedTheme,
  resolveSlots,
} from "../src/utils/ui";

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

  it("supports all standard semantic colors out of the box", () => {
    for (const color of [
      "primary",
      "neutral",
      "danger",
      "success",
      "warning",
      "info",
    ] as const) {
      const solid = resolveSlots(
        buttonTheme({ variant: "solid", color }) as any,
      );
      expect(solid.root).toContain(`bg-${color}`);
      expect(solid.root).toContain("text-white");

      const outline = resolveSlots(
        buttonTheme({ variant: "outline", color }) as any,
      );
      expect(outline.root).toContain(`border-${color}`);
      expect(outline.root).toContain(`text-${color}`);

      const soft = resolveSlots(buttonTheme({ variant: "soft", color }) as any);
      expect(soft.root).toContain(escapeClass(`bg-${color}/10`));
      expect(soft.root).toContain(`text-${color}`);
    }
  });
});

describe("getResolvedTheme", () => {
  it("picks up a changed global config without clearing the cache manually", () => {
    clearThemeCache();
    const rootOf = () =>
      resolveSlots(
        getResolvedTheme("button", buttonTheme)({ variant: "solid" }) as any,
      ).root;

    setConfig({
      components: { button: { slots: { root: "first-override" } } },
    });
    expect(rootOf()).toContain("first-override");

    // Simulates the virtual config module re-executing after an HMR update.
    setConfig({
      components: { button: { slots: { root: "second-override" } } },
    });
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
    const resolved = resolveSlots(
      theme({ variant: "solid", color: "primary" }) as any,
    );

    // text-red-500 must replace text-white!
    expect(resolved.root).toContain("text-red-500");
    expect(resolved.root).not.toContain("text-white");
    expect(resolved.root).toContain("bg-primary");

    resetConfig();
    clearThemeCache();
  });

  it("supports function replacers in cui.config.ts slots to augment defaults", () => {
    clearThemeCache();
    setConfig({
      components: {
        button: {
          slots: {
            root: (defaults) => `${defaults} custom-augmented-class`,
          },
        },
      },
    });

    const theme = getResolvedTheme("button", buttonTheme);
    const resolved = resolveSlots(
      theme({ variant: "solid", color: "primary" }) as any,
    );

    expect(resolved.root).toContain("custom-augmented-class");
    expect(resolved.root).toContain("bg-primary");

    resetConfig();
    clearThemeCache();
  });

  it("supports function replacers in cui.config.ts slots to completely replace defaults", () => {
    clearThemeCache();
    setConfig({
      components: {
        button: {
          slots: {
            label: () => "only-my-custom-label",
          },
        },
      },
    });

    const theme = getResolvedTheme("button", buttonTheme);
    const resolved = resolveSlots(
      theme({ variant: "solid", color: "primary" }) as any,
    );

    expect(resolved.label).toBe("only-my-custom-label");

    resetConfig();
    clearThemeCache();
  });

  it("dynamically generates solid, outline, ghost, soft compound variants for custom colors in cui.config.ts", () => {
    clearThemeCache();
    setConfig({
      ui: {
        colors: {
          brand: "#3b82f6",
        },
      },
    });

    const theme = getResolvedTheme("button", buttonTheme);

    const solidBrand = resolveSlots(
      theme({ variant: "solid", color: "brand" }) as any,
    );
    expect(solidBrand.root.split(" ")).toContain("bg-brand");
    expect(solidBrand.root.split(" ")).toContain("text-white");

    const outlineBrand = resolveSlots(
      theme({ variant: "outline", color: "brand" }) as any,
    );
    expect(outlineBrand.root.split(" ")).toContain("border-brand");
    expect(outlineBrand.root.split(" ")).toContain("text-brand");

    const ghostBrand = resolveSlots(
      theme({ variant: "ghost", color: "brand" }) as any,
    );
    expect(ghostBrand.root.split(" ")).toContain("text-brand");
    expect(ghostBrand.root.split(" ")).not.toContain("bg-brand");

    const softBrand = resolveSlots(
      theme({ variant: "soft", color: "brand" }) as any,
    );
    expect(softBrand.root).toContain(escapeClass("bg-brand/10"));
    expect(softBrand.root.split(" ")).toContain("text-brand");

    resetConfig();
    clearThemeCache();
  });
});

describe("dedupeClasses", () => {
  it("drops earlier conflicting color and background classes", () => {
    expect(dedupeClasses("bg-emerald-600 text-white", "text-red-500")).toBe(
      "bg-emerald-600 text-red-500",
    );
    expect(
      dedupeClasses("bg-emerald-600 text-white", "bg-black text-red-500"),
    ).toBe("bg-black text-red-500");
  });

  it("drops earlier padding and margin classes", () => {
    expect(dedupeClasses("px-4 py-2", "px-6")).toBe("py-2 px-6");
    expect(dedupeClasses("m-2", "m-4")).toBe("m-4");
  });

  it("drops earlier rounded and shadow classes", () => {
    expect(
      dedupeClasses("rounded-md shadow-sm", "rounded-full shadow-2xl"),
    ).toBe("rounded-full shadow-2xl");
    expect(dedupeClasses("rounded-lg", "rounded-full")).toBe("rounded-full");
    expect(dedupeClasses("rounded-md", "rounded-sm")).toBe("rounded-sm");
    expect(dedupeClasses("rounded-none", "rounded-xl")).toBe("rounded-xl");
    expect(dedupeClasses("rounded-t-sm", "rounded-t-lg")).toBe("rounded-t-lg");
  });

  it("handles modifier variants independently", () => {
    expect(
      dedupeClasses(
        "active:bg-emerald-700 bg-emerald-600",
        "bg-black active:bg-neutral-800",
      ),
    ).toBe("bg-black active:bg-neutral-800");
  });
});

describe("tv type safety & variant inference", () => {
  it("infers slots and variant props correctly", () => {
    const custom = tv({
      slots: {
        root: "base-root",
        icon: "base-icon",
      },
      variants: {
        size: {
          sm: { root: "h-8" },
          lg: { root: "h-12" },
        },
        active: {
          true: { root: "is-active" },
          false: { root: "not-active" },
        },
      },
      defaultVariants: {
        size: "sm",
      },
    });

    const res = custom({ size: "lg", active: true });
    expect(res.root()).toContain("h-12");
    expect(res.root()).toContain("is-active");
    expect(res.icon()).toBe("base-icon");
  });
});

describe("switchTheme resolution", () => {
  const switchTheme = tv(createSwitchTheme());

  it("resolves unchecked state classes correctly", () => {
    const slots = resolveSlots(
      switchTheme({ checked: false, size: "md", color: "primary" }) as any,
    );

    expect(slots.base).toContain("bg-neutral-200");
    expect(slots.base).not.toContain("bg-primary");
    expect(slots.thumb).toContain("translate-x-0");
    expect(slots.thumb).toContain("translate-y-0");
    expect(slots.thumb).not.toContain("translate-x-4");
    expect(slots.icon).toContain("opacity-0");
    expect(slots.icon).not.toContain("opacity-100");
  });

  it("resolves checked state classes and thumb translations across sizes", () => {
    const sizeTranslations: Record<string, string> = {
      xs: "translate-x-3",
      sm: "translate-x-3.5",
      md: "translate-x-4",
      lg: "translate-x-4.5",
      xl: "translate-x-5",
    };

    for (const [size, expectedTranslate] of Object.entries(sizeTranslations)) {
      const slots = resolveSlots(
        switchTheme({ checked: true, size, color: "primary" }) as any,
      );

      if (size === "lg") {
        console.log("LG THUMB SLOTS:", slots.thumb);
      }
      expect(slots.base).toContain("bg-primary");
      expect(slots.base).not.toContain("bg-neutral-200");
      expect(slots.thumb).toContain(escapeClass(expectedTranslate));
      expect(slots.thumb).toContain("translate-y-0");
      expect(slots.thumb).not.toContain("translate-x-0");
      expect(slots.icon).toContain("text-primary");
      expect(slots.icon).toContain("opacity-100");
    }
  });

  it("supports semantic colors when checked", () => {
    for (const color of ["danger", "success", "warning", "info"] as const) {
      const slots = resolveSlots(
        switchTheme({ checked: true, size: "md", color }) as any,
      );

      expect(slots.base).toContain(`bg-${color}`);
      expect(slots.icon).toContain(`text-${color}`);
    }
  });

  it("handles invalid state on switch", () => {
    // Unchecked invalid switch
    const uncheckedInvalid = resolveSlots(
      switchTheme({ checked: false, invalid: true, color: "primary" }) as any,
    );
    expect(uncheckedInvalid.base).toContain("ring-1");
    expect(uncheckedInvalid.base).toContain("ring-danger");
    expect(uncheckedInvalid.base).toContain("border-transparent");
    expect(uncheckedInvalid.base).not.toContain("border-danger");

    // Checked invalid switch
    const checkedInvalid = resolveSlots(
      switchTheme({ checked: true, invalid: true, color: "primary" }) as any,
    );
    expect(checkedInvalid.base).toContain("bg-danger");
    expect(checkedInvalid.base).not.toContain("bg-primary");
    expect(checkedInvalid.icon).toContain("text-danger");
  });
});

describe("inputTheme invalid & highlight theming", () => {
  const inputTheme = tv(createInputTheme());

  it("applies primary focus/ring when valid", () => {
    const slots = resolveSlots(
      inputTheme({ color: "primary", invalid: false, highlight: false }) as any,
    );
    expect(slots.base).toContain(escapeClass("focus:border-primary"));
    expect(slots.base).toContain(escapeClass("focus:ring-primary/20"));
    expect(slots.base).not.toContain("border-danger");
    expect(slots.base).not.toContain(escapeClass("ring-danger/20"));
  });

  it("applies highlight ring in specified color", () => {
    const slots = resolveSlots(
      inputTheme({ color: "primary", highlight: true, invalid: false }) as any,
    );
    expect(slots.base).toContain("border-primary");
    expect(slots.base).toContain(escapeClass("ring-primary/20"));
    expect(slots.base).not.toContain("border-danger");
  });

  it("overrides primary color with danger styles when invalid: true", () => {
    const slots = resolveSlots(
      inputTheme({ color: "primary", invalid: true, highlight: false }) as any,
    );
    expect(slots.base).toContain("border-danger");
    expect(slots.base).toContain("ring-2");
    expect(slots.base).toContain(escapeClass("ring-danger/20"));
    expect(slots.base).toContain(escapeClass("focus:border-danger"));
    expect(slots.base).toContain(escapeClass("focus:ring-danger/20"));
    expect(slots.base).not.toContain("border-neutral-300");
  });

  it("supports custom errorColor via theme options", () => {
    const customTheme = tv(createInputTheme({ errorColor: "rose" }));
    const slots = resolveSlots(
      customTheme({ color: "primary", invalid: true }) as any,
    );
    expect(slots.base).toContain("border-rose");
    expect(slots.base).toContain(escapeClass("ring-rose/20"));
    expect(slots.base).toContain(escapeClass("focus:border-rose"));
  });
});

describe("pinInputTheme invalid & highlight theming", () => {
  const pinInputTheme = tv(createPinInputTheme());

  it("applies primary focus when valid", () => {
    const slots = resolveSlots(
      pinInputTheme({ color: "primary", invalid: false }) as any,
    );
    expect(slots.input).toContain(escapeClass("focus:border-primary"));
    expect(slots.input).not.toContain("border-danger");
  });

  it("overrides with danger styles when invalid: true", () => {
    const slots = resolveSlots(
      pinInputTheme({ color: "primary", invalid: true }) as any,
    );
    expect(slots.input).toContain("border-danger");
    expect(slots.input).toContain(escapeClass("ring-danger/20"));
    expect(slots.input).toContain(escapeClass("focus:border-danger"));
  });
});

describe("textareaTheme autoHeight and variants", () => {
  const textareaTheme = tv(createTextareaTheme());

  it("applies min-h-24 by default when autoHeight is false", () => {
    const slots = resolveSlots(
      textareaTheme({ size: "md", autoHeight: false }) as any,
    );
    expect(slots.root).toContain("min-h-24");
    expect(slots.root).not.toContain("min-h-0");
  });

  it("overrides min-h-* with min-h-0 when autoHeight is true", () => {
    const slots = resolveSlots(
      textareaTheme({ size: "md", autoHeight: true }) as any,
    );
    expect(slots.root).toContain("min-h-0");
    expect(slots.root).not.toContain("min-h-24");
  });

  it("applies pb-7 when count is true for size md", () => {
    const slots = resolveSlots(
      textareaTheme({ size: "md", count: true, autoHeight: true }) as any,
    );
    expect(slots.root).toContain("pb-7");
    expect(slots.root).toContain("min-h-0");
  });

  it("applies danger styling when invalid: true", () => {
    const slots = resolveSlots(textareaTheme({ invalid: true }) as any);
    expect(slots.root).toContain("border-danger");
    expect(slots.root).toContain(escapeClass("ring-danger/20"));
  });

  it("resolves placeholder slot styling across sizes", () => {
    const slots = resolveSlots(textareaTheme({ size: "md" }) as any);
    expect(slots.placeholder).toContain("text-neutral-400");
    expect(slots.placeholder).toContain("text-sm");
  });
});

describe("radioTheme resolution", () => {
  it("resolves default slots and classes", () => {
    const slots = resolveSlots(radioTheme() as any);
    expect(slots.root).toContain("inline-flex items-start");
    expect(slots.base).toContain("rounded-full");
    expect(slots.indicator).toContain("rounded-full");
  });

  it("resolves variant = card styling", () => {
    const slots = resolveSlots(radioTheme({ variant: "card" }) as any);
    expect(slots.root).toContain("p-3 rounded-xl border");
    expect(slots.root).toContain("shadow-xs");
  });

  it("resolves checked card styling with color", () => {
    const slots = resolveSlots(
      radioTheme({ variant: "card", color: "primary", checked: true }) as any,
    );
    expect(slots.root).toContain("border-primary");
    expect(slots.root).toContain("ring-primary");
    expect(slots.indicator).toContain("bg-primary");
  });

  it("resolves invalid card styling even when unchecked", () => {
    const slots = resolveSlots(
      radioTheme({ variant: "card", invalid: true, checked: false }) as any,
    );
    expect(slots.root).toContain("border-danger");
    expect(slots.root).toContain("ring-danger");
    expect(slots.base).toContain("border-danger");
  });
});

describe("radioGroupTheme resolution", () => {
  it("resolves default slots and classes", () => {
    const slots = resolveSlots(radioGroupTheme() as any);
    expect(slots.root).toContain("inline-flex flex-col");
    expect(slots.fieldset).toContain("flex flex-col gap-2");
    expect(slots.item).toContain("inline-flex items-start");
    expect(slots.base).toContain("rounded-full");
    expect(slots.indicator).toContain("rounded-full");
  });

  it("resolves horizontal orientation", () => {
    const slots = resolveSlots(
      radioGroupTheme({ orientation: "horizontal" }) as any,
    );
    expect(slots.fieldset).toContain("flex-row flex-wrap gap-4");
  });

  it("resolves checked compound variant with color", () => {
    const slots = resolveSlots(
      radioGroupTheme({ color: "primary", checked: true }) as any,
    );
    expect(slots.base).toContain("border-primary");
    expect(slots.indicator).toContain("bg-primary");
  });

  it("resolves invalid styling", () => {
    const slots = resolveSlots(radioGroupTheme({ invalid: true }) as any);
    expect(slots.base).toContain("border-danger");
    expect(slots.base).toContain("ring-danger");
  });

  it("resolves disabled state", () => {
    const slots = resolveSlots(radioGroupTheme({ disabled: true }) as any);
    expect(slots.item).toContain("opacity-50 cursor-not-allowed");
    expect(slots.base).toContain("cursor-not-allowed");
  });
});

describe("dedupeClasses ring utilities", () => {
  it("deduplicates ring widths and ring colors", () => {
    expect(
      dedupeClasses("ring-2 ring-primary/20", "ring-4 ring-danger/20"),
    ).toBe("ring-4 ring-danger/20");
  });

  it("deduplicates variant-prefixed ring colors", () => {
    expect(
      dedupeClasses(
        "focus:ring-primary/20 focus:border-primary",
        "focus:ring-danger/20 focus:border-danger",
      ),
    ).toBe("focus:ring-danger/20 focus:border-danger");
  });
});

describe("iconTheme resolution", () => {
  it("defaults to a 1em, non-shrinking box", () => {
    const slots = resolveSlots(iconTheme() as any);
    expect(slots.root).toContain("shrink-0");
    expect(slots.root).toContain(escapeClass("size-[1em]"));
  });

  it("accepts size, color and animation as plain classes", () => {
    const slots = resolveSlots(
      iconTheme() as any,
      undefined,
      "size-5 text-danger animate-spin",
    );
    // user size replaces the 1em default instead of stacking with it
    expect(slots.root).not.toContain(escapeClass("size-[1em]"));
    expect(slots.root).toContain("size-5");
    expect(slots.root).toContain("text-danger");
    expect(slots.root).toContain("animate-spin");
  });
});

describe("checkboxTheme resolution", () => {
  it("resolves unchecked state", () => {
    const slots = resolveSlots(checkboxTheme() as any);
    expect(slots.base).toContain("border-neutral-300");
    expect(slots.indicator).toContain("opacity-0");
  });

  it("resolves checked state with color", () => {
    const slots = resolveSlots(
      checkboxTheme({ checked: true, color: "primary" }) as any,
    );
    expect(slots.base).toContain("bg-primary");
    expect(slots.indicator).toContain("opacity-100");
  });

  it("resolves indeterminate state", () => {
    const slots = resolveSlots(
      checkboxTheme({ indeterminate: true, color: "danger" }) as any,
    );
    expect(slots.base).toContain("bg-danger");
    expect(slots.indicator).toContain("opacity-100");
  });

  it("resolves card variant", () => {
    const slots = resolveSlots(
      checkboxTheme({
        variant: "card",
        checked: true,
        color: "primary",
      }) as any,
    );
    expect(slots.root).toContain("border-primary");
    expect(slots.base).toContain("bg-primary");
  });

  it("resolves invalid state", () => {
    const slots = resolveSlots(
      checkboxTheme({ invalid: true, checked: true }) as any,
    );
    expect(slots.base).toContain("bg-danger");
  });
});

describe("checkboxGroupTheme resolution", () => {
  it("resolves default slots and orientation", () => {
    const slots = resolveSlots(checkboxGroupTheme() as any);
    expect(slots.root).toContain("relative");
    expect(slots.fieldset).toContain("flex-col");
    expect(slots.legend).toContain("font-medium");
    expect(slots.base).toContain("rounded");
  });

  it("resolves horizontal orientation", () => {
    const slots = resolveSlots(
      checkboxGroupTheme({ orientation: "horizontal" }) as any,
    );
    expect(slots.fieldset).toContain("flex-row");
  });

  it("resolves card variant and size", () => {
    const slots = resolveSlots(
      checkboxGroupTheme({ variant: "card", size: "lg" }) as any,
    );
    expect(slots.item).toContain("rounded-xl");
    expect(slots.base).toContain("w-5");
  });

  it("resolves required and invalid states", () => {
    const slots = resolveSlots(
      checkboxGroupTheme({ required: true, invalid: true }) as any,
    );
    expect(slots.legend).toContain("after_ctext-danger");
    expect(slots.base).toContain("border-danger");
  });
});

describe("avatarTheme resolution", () => {
  it("resolves default slots", () => {
    const slots = resolveSlots(avatarTheme() as any);
    expect(slots.root).toContain("size-8");
    expect(slots.image).toContain("h-full w-full");
    expect(slots.fallback).toContain("text-sm");
    expect(slots.icon).toContain("shrink-0");
  });

  it("resolves avatar color and size", () => {
    const slots = resolveSlots(
      avatarTheme({ color: "primary", size: "lg" }) as any,
      undefined,
      "",
    );
    expect(slots.root).toContain("bg-primary_f10");
    expect(slots.root).toContain("size-9");
    expect(slots.fallback).toContain("text-md");
  });

  it("resolves neutral color correctly", () => {
    const slots = resolveSlots(
      avatarTheme({ color: "neutral" }) as any,
      {},
      "",
    );
    expect(slots.root).toContain("size-8");
    expect(slots.fallback).toContain("text-muted");
    expect(slots.fallback).toContain("text-sm");
  });
});
