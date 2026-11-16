import { describe, expect, it } from "vitest";
import { inputMenuItemTheme } from "../src";

describe("inputMenuItemTheme (@code-ui/core)", () => {
  it("provides all input-menu-item anatomy slots", () => {
    const theme = inputMenuItemTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("base");
    expect(theme.slots).toHaveProperty("leading");
    expect(theme.slots).toHaveProperty("leadingIcon");
    expect(theme.slots).toHaveProperty("wrapper");
    expect(theme.slots).toHaveProperty("label");
    expect(theme.slots).toHaveProperty("description");
    expect(theme.slots).toHaveProperty("trailing");
    expect(theme.slots).toHaveProperty("trailingIcon");
    expect(theme.slots).toHaveProperty("groupLabel");
    expect(theme.slots).toHaveProperty("separator");
  });

  it("supports all 5 sizes, colors, selected and disabled states", () => {
    const theme = inputMenuItemTheme();
    expect(theme.defaultVariants).toEqual({
      color: "primary",
      size: "md",
      selected: false,
      disabled: false,
    });
    expect(Object.keys(theme.variants.size)).toEqual([
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
    ]);
    expect(theme.variants.selected.true.base).toContain("bg-elevated");
    expect(theme.variants.disabled.true.base).toContain("pointer-events-none");
  });
});
