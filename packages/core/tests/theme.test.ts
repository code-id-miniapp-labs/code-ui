import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_COLORS,
  createColorVariants,
  createColorCompoundVariants,
  defineTheme,
  type ComponentTheme,
  type ExtractSlots,
  type ComponentRegistry,
  buttonTheme,
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

    const {
      checkboxTheme,
      inputTheme,
      switchTheme,
      iconTheme,
      getIcons,
      getIcon,
    } = await import("../src");
    const checkbox = checkboxTheme();
    expect(checkbox.slots).toHaveProperty("root");
    expect(checkbox.slots).toHaveProperty("base");
    expect(checkbox.slots).toHaveProperty("indicator");
    expect(checkbox.slots).toHaveProperty("icon");
    expect(checkbox.slots).toHaveProperty("wrapper");
    expect(checkbox.slots).toHaveProperty("label");
    expect(checkbox.slots).toHaveProperty("description");
    expect(checkbox.defaultVariants).toMatchObject({
      variant: "outline",
      color: "primary",
      size: "md",
      checked: false,
      indeterminate: false,
    });
    const icon = iconTheme();
    expect(Object.keys(icon.slots)).toEqual(["root"]);
    expect(icon.variants).toEqual({});
    expect(getIcons().check).toBe("i-lucide-check");
    expect(getIcon("check")).toBe("i-lucide-check");
    expect(getIcon("minus")).toBe("i-lucide-minus");
    expect(getIcon("close")).toBe("i-lucide-x");
    expect(getIcon("loading")).toBe("i-lucide-loader-circle");

    // Multiple collections: first entry is the primary (drives default aliases)
    const { setConfig, resetConfig, getActiveCollections } =
      await import("../src");
    setConfig({
      icons: {
        collections: ["tabler", "lucide", "mdi"],
      },
    });
    expect(getActiveCollections()).toEqual(["tabler", "lucide", "mdi"]);
    expect(getIcon("check")).toBe("i-tabler-check");
    expect(getIcon("lucide:check")).toBe("i-lucide-check");
    expect(getIcon("mdi:loading")).toBe("i-mdi-loading");
    expect(getIcon("tabler:home")).toBe("i-tabler-home");
    expect(getIcon("lucide:heart")).toBe("i-lucide-heart");
    resetConfig();

    setConfig({ icons: { collections: ["tabler"] } });
    expect(getIcon("check")).toBe("i-tabler-check");
    expect(getIcon("minus")).toBe("i-tabler-minus");
    expect(getIcon("close")).toBe("i-tabler-x");
    expect(getIcon("loading")).toBe("i-tabler-loader-2");
    resetConfig();

    // Test custom prefix and granular overrides
    setConfig({
      icons: {
        collections: ["mdi"],
        prefix: "icon",
        check: "icon-custom-check",
        search: "icon-mdi-magnify",
      },
    });
    expect(getIcon("check")).toBe("icon-custom-check");
    expect(getIcon("minus")).toBe("icon-mdi-minus");
    expect(getIcon("close")).toBe("icon-mdi-close");
    expect(getIcon("loading")).toBe("icon-mdi-loading");
    expect(getIcon("search")).toBe("icon-mdi-magnify");
    resetConfig();

    const input = inputTheme();
    expect(input.slots).toHaveProperty("root");
    expect(input.slots).toHaveProperty("base");
    expect(input.slots).toHaveProperty("leading");
    expect(input.slots).toHaveProperty("trailing");
    expect(input.slots).toHaveProperty("leadingIcon");
    expect(input.slots).toHaveProperty("trailingIcon");
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

  it("extracts slots dynamically via ExtractSlots and ComponentRegistry", () => {
    // 1. From theme factory function directly
    const btn = buttonTheme();
    expect(btn.slots).toHaveProperty("root");
    type ButtonSlots = ExtractSlots<typeof buttonTheme>;
    const btnSlot1: ButtonSlots = "root";
    const btnSlot2: ButtonSlots = "label";
    const btnSlot3: ButtonSlots = "spinner";
    expect([btnSlot1, btnSlot2, btnSlot3]).toBeDefined();

    // 2. From defineTheme definition object
    const customTheme = defineTheme({
      slots: {
        root: "root-cls",
        header: "header-cls",
        content: "content-cls",
      },
      variants: {},
    });
    type CustomSlots = ExtractSlots<typeof customTheme>;
    const customSlot: CustomSlots = "header";
    expect(customSlot).toBe("header");

    // 3. ComponentRegistry has both camelCase and kebab-case keys automatically mapped
    type StepperSlots = ComponentRegistry["stepper"];
    type StepperItemSlots = ComponentRegistry["stepperItem"];
    type StepperItemKebabSlots = ComponentRegistry["stepper-item"];
    type CheckboxGroupKebabSlots = ComponentRegistry["checkbox-group"];

    const sSlot: StepperSlots = "header";
    const siSlot: StepperItemSlots = "indicator";
    const sikSlot: StepperItemKebabSlots = "indicator";
    const cgkSlot: CheckboxGroupKebabSlots = "legend";

    expect([sSlot, siSlot, sikSlot, cgkSlot]).toBeDefined();
  });
});
