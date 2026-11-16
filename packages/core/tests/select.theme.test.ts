import { describe, expect, it } from "vitest";
import { selectTheme } from "../src";

describe("selectTheme (@code-ui/core)", () => {
  it("provides trigger, dropdown, and picker slots", () => {
    const theme = selectTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("base");
    expect(theme.slots).toHaveProperty("value");
    expect(theme.slots).toHaveProperty("placeholder");
    expect(theme.slots).toHaveProperty("viewport");
    expect(theme.slots).toHaveProperty("pickerRoot");
    expect(theme.slots).toHaveProperty("pickerBackdrop");
    expect(theme.slots).toHaveProperty("pickerContent");
    expect(theme.slots).toHaveProperty("pickerHeader");
    expect(theme.slots).toHaveProperty("pickerView");
    expect(theme.slots).toHaveProperty("pickerItem");
  });

  it("supports Nuxt UI input variants, colors, sizes, and open/picker states", () => {
    const theme = selectTheme();
    expect(theme.defaultVariants).toEqual({
      variant: "outline",
      color: "primary",
      size: "md",
      open: false,
      visible: false,
      leading: false,
      trailing: true,
      highlight: false,
      disabled: false,
      invalid: false,
    });
    expect(theme.slots.viewport).toContain("flex-col");
    expect(theme.slots.viewport).toContain("gap-1");
    expect(theme.variants.visible.true.root).toContain("z-50");
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
    expect(theme.variants.open.true.trailingIcon).toContain("rotate-180");
    expect(theme.variants.open.true.pickerContent).toContain("translate-y-0");
    expect(theme.variants.open.false.pickerContent).toContain("translate-y-full");
  });
});
