import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_COLORS, dividerTheme } from "../src";

describe("dividerTheme (@code-ui/core)", () => {
  it("provides all required slots", () => {
    const theme = dividerTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("container");
    expect(theme.slots).toHaveProperty("border");
    expect(theme.slots).toHaveProperty("icon");
    expect(theme.slots).toHaveProperty("label");

    expect(theme.slots.root).toBe("flex items-center");
    expect(theme.slots.container).toBe("flex items-center gap-2 shrink-0");
    expect(theme.slots.border).toBe("flex-1");
  });

  it("sets correct default variants", () => {
    const theme = dividerTheme();
    expect(theme.defaultVariants).toEqual({
      color: "neutral",
      size: "xs",
      type: "solid",
      orientation: "horizontal",
      position: "center",
    });
  });

  it("supports horizontal and vertical orientations", () => {
    const theme = dividerTheme();
    expect(theme.variants.orientation.horizontal).toEqual({
      root: "w-full flex-row",
      border: "border-t",
    });
    expect(theme.variants.orientation.vertical).toEqual({
      root: "h-full flex-col",
      border: "border-s border-t-0",
    });
  });

  it("supports line types (solid, dashed, dotted)", () => {
    const theme = dividerTheme();
    expect(theme.variants.type.solid).toEqual({ border: "border-solid" });
    expect(theme.variants.type.dashed).toEqual({ border: "border-dashed" });
    expect(theme.variants.type.dotted).toEqual({ border: "border-dotted" });
  });

  it("supports sizes for container typography", () => {
    const theme = dividerTheme();
    expect(theme.variants.size.xs.container).toBe("text-[10px]");
    expect(theme.variants.size.sm.container).toBe("text-xs");
    expect(theme.variants.size.md.container).toBe("text-sm");
    expect(theme.variants.size.lg.container).toBe("text-base");
    expect(theme.variants.size.xl.container).toBe("text-lg");
  });

  it("creates color variants for default theme colors", () => {
    const theme = dividerTheme();
    expect(Object.keys(theme.variants.color)).toEqual(DEFAULT_THEME_COLORS);
  });

  it("creates custom color variants when colors option is provided", () => {
    const customColors = ["custom-red", "custom-blue"] as const;
    const theme = dividerTheme({ colors: customColors });
    expect(Object.keys(theme.variants.color)).toEqual(customColors);

    const hasCustomRedBorder = theme.compoundVariants.some(
      (cv) => cv.color === "custom-red" && cv.class?.border === "border-custom-red",
    );
    expect(hasCustomRedBorder).toBe(true);
  });

  it("configures compound variants for horizontal content positions", () => {
    const theme = dividerTheme();
    const hStart = theme.compoundVariants.find(
      (cv) => cv.orientation === "horizontal" && cv.position === "start",
    );
    const hCenter = theme.compoundVariants.find(
      (cv) => cv.orientation === "horizontal" && cv.position === "center",
    );
    const hEnd = theme.compoundVariants.find(
      (cv) => cv.orientation === "horizontal" && cv.position === "end",
    );

    expect(hStart?.class?.container).toBe("me-3");
    expect(hCenter?.class?.container).toBe("mx-3");
    expect(hEnd?.class?.container).toBe("ms-3");
  });

  it("configures compound variants for vertical content positions", () => {
    const theme = dividerTheme();
    const vStart = theme.compoundVariants.find(
      (cv) => cv.orientation === "vertical" && cv.position === "start",
    );
    const vCenter = theme.compoundVariants.find(
      (cv) => cv.orientation === "vertical" && cv.position === "center",
    );
    const vEnd = theme.compoundVariants.find(
      (cv) => cv.orientation === "vertical" && cv.position === "end",
    );

    expect(vStart?.class?.container).toBe("mb-2");
    expect(vCenter?.class?.container).toBe("my-2");
    expect(vEnd?.class?.container).toBe("mt-2");
  });

  it("configures compound variants for border widths in both orientations", () => {
    const theme = dividerTheme();

    const hSizes = ["xs", "sm", "md", "lg", "xl"];
    const expectedHBorder = [
      "border-t",
      "border-t-[2px]",
      "border-t-[3px]",
      "border-t-[4px]",
      "border-t-[5px]",
    ];
    hSizes.forEach((size, idx) => {
      const match = theme.compoundVariants.find(
        (cv) => cv.orientation === "horizontal" && cv.size === size,
      );
      expect(match?.class?.border).toBe(expectedHBorder[idx]);
    });

    const expectedVBorder = [
      "border-s",
      "border-s-[2px]",
      "border-s-[3px]",
      "border-s-[4px]",
      "border-s-[5px]",
    ];
    hSizes.forEach((size, idx) => {
      const match = theme.compoundVariants.find(
        (cv) => cv.orientation === "vertical" && cv.size === size,
      );
      expect(match?.class?.border).toBe(expectedVBorder[idx]);
    });
  });
});
