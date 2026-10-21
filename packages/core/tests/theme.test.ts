import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  createColorCompoundVariants,
  defineTheme,
  type ComponentTheme,
} from "../src";

describe("@code-ui/core color generation", () => {
  it("includes all standard semantic colors in DEFAULT_THEME_COLORS", () => {
    expect(DEFAULT_THEME_COLORS).toEqual([
      "primary",
      "neutral",
      "danger",
      "success",
      "warning",
      "info",
    ]);
  });

  it("createColorVariants generates an empty map for default colors", () => {
    const variants = createColorVariants();
    expect(Object.keys(variants)).toEqual([
      "primary",
      "neutral",
      "danger",
      "success",
      "warning",
      "info",
    ]);
    expect(variants.primary).toEqual({});
    expect(variants.success).toEqual({});
  });

  it("createColorVariants generates an empty map for custom colors", () => {
    const customColors = ["brand", "accent"] as const;
    const variants = createColorVariants(customColors);
    expect(Object.keys(variants)).toEqual(["brand", "accent"]);
    expect(variants.brand).toEqual({});
    expect(variants.accent).toEqual({});
  });

  it("createColorCompoundVariants generates compound rules across all colors", () => {
    const compounds = createColorCompoundVariants(DEFAULT_THEME_COLORS, {
      solid: (color) => ({ root: `bg-${color} text-white` }),
      outline: (color) => ({ root: `border border-${color} text-${color}` }),
    });

    expect(compounds).toHaveLength(12);

    const solidPrimary = compounds.find(
      (c) => c.variant === "solid" && c.color === "primary",
    );
    expect(solidPrimary?.class.root).toBe("bg-primary text-white");

    const outlineSuccess = compounds.find(
      (c) => c.variant === "outline" && c.color === "success",
    );
    expect(outlineSuccess?.class.root).toBe(
      "border border-success text-success",
    );
  });

  it("defineTheme works seamlessly with createColorVariants and createColorCompoundVariants", () => {
    const theme = defineTheme({
      slots: {
        root: "base-class",
      },
      variants: {
        variant: {
          solid: { root: "shadow" },
          outline: { root: "border" },
        },
        color: createColorVariants(),
      },
      compoundVariants: [
        ...createColorCompoundVariants(DEFAULT_THEME_COLORS, {
          solid: (color) => ({ root: `bg-${color}` }),
        }),
      ],
      defaultVariants: {
        variant: "solid",
        color: "primary",
      },
    });

    expect(theme.defaultVariants.variant).toBe("solid");
    expect(theme.defaultVariants.color).toBe("primary");
    expect(theme.compoundVariants).toHaveLength(6);

    type InferredTheme = ComponentTheme<typeof theme>;
    type InferredColor = InferredTheme["variants"]["color"];
    const colorTest: InferredColor = "warning";
    expect(colorTest).toBe("warning");
  });

  it("provides theme definitions for card, chip, and pinInput", async () => {
    const { cardTheme, chipTheme, pinInputTheme } = await import("../src");

    const card = cardTheme();
    expect(card.slots).toHaveProperty("root");
    expect(card.slots).toHaveProperty("header");
    expect(card.slots).toHaveProperty("body");
    expect(card.slots).toHaveProperty("footer");
    expect(card.defaultVariants).toEqual({ variant: "outline", size: "md" });

    const chip = chipTheme();
    expect(chip.slots).toHaveProperty("root");
    expect(chip.slots).toHaveProperty("base");
    expect(chip.defaultVariants).toEqual({
      size: "md",
      color: "primary",
      position: "top-right",
      inset: false,
      standalone: false,
    });

    const pinInput = pinInputTheme();
    expect(pinInput.slots).toHaveProperty("root");
    expect(pinInput.slots).toHaveProperty("control");
    expect(pinInput.slots).toHaveProperty("input");
    expect(pinInput.slots).toHaveProperty("separator");
    expect(pinInput.defaultVariants).toMatchObject({
      variant: "outline",
      color: "primary",
      size: "md",
    });

    const { inputTheme, switchTheme } = await import("../src");
    const input = inputTheme();
    expect(input.slots).toHaveProperty("root");
    expect(input.slots).toHaveProperty("base");
    expect(input.slots).toHaveProperty("leading");
    expect(input.slots).toHaveProperty("trailing");
    expect(input.slots).toHaveProperty("clear");
    expect(input.defaultVariants).toMatchObject({
      variant: "outline",
      color: "primary",
      size: "md",
    });

    const sw = switchTheme();
    expect(sw.slots).toHaveProperty("root");
    expect(sw.slots).toHaveProperty("base");
    expect(sw.slots).toHaveProperty("container");
    expect(sw.slots).toHaveProperty("thumb");
    expect(sw.slots).toHaveProperty("icon");
    expect(sw.slots).toHaveProperty("wrapper");
    expect(sw.slots).toHaveProperty("label");
    expect(sw.slots).toHaveProperty("description");
    expect(sw.defaultVariants).toMatchObject({
      color: "primary",
      size: "md",
      disabled: false,
      checked: false,
    });
  });
});
