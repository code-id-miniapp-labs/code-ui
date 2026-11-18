import { describe, expect, it } from "vitest";
import { inputMenuTheme } from "../src";

describe("inputMenuTheme (@code-id-labs/core)", () => {
  it("provides input, tags, dropdown, and createItem slots", () => {
    const theme = inputMenuTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("base");
    expect(theme.slots).toHaveProperty("nativeInput");
    expect(theme.slots).toHaveProperty("tagsWrapper");
    expect(theme.slots).toHaveProperty("tagsItem");
    expect(theme.slots).toHaveProperty("tagsItemText");
    expect(theme.slots).toHaveProperty("tagsItemDelete");
    expect(theme.slots).toHaveProperty("viewport");
    expect(theme.slots).toHaveProperty("createItem");
    expect(theme.slots).toHaveProperty("createItemLabel");
  });

  it("supports Nuxt UI input variants, colors, sizes, multiple, open, and focused states", () => {
    const theme = inputMenuTheme();
    expect(theme.defaultVariants).toEqual({
      variant: "outline",
      color: "primary",
      size: "md",
      multiple: false,
      open: false,
      focused: false,
      leading: false,
      trailing: true,
      highlight: false,
      disabled: false,
      invalid: false,
    });
    expect(theme.slots.viewport).toContain("flex-col");
    expect(theme.variants.open.true.root).toContain("z-50");
    expect(theme.variants.open.true.trailingIcon).toContain("rotate-180");
    expect(theme.variants.multiple.true.base).toContain("h-auto");
    expect(theme.variants.multiple.true.base).not.toContain("flex-wrap");
    expect(theme.variants.multiple.true.tagsWrapper).toContain("flex-wrap");
    expect(Object.keys(theme.variants.variant)).toEqual([
      "outline",
      "soft",
      "subtle",
      "ghost",
      "none",
    ]);
    expect(Object.keys(theme.variants.size)).toEqual([
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
    ]);
  });
});
