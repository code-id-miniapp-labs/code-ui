import { describe, expect, it } from "vitest";
import { progressTheme } from "../src";

describe("progressTheme (@code-ui/core)", () => {
  it("provides all required slots", () => {
    const theme = progressTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("track");
    expect(theme.slots).toHaveProperty("range");
    expect(theme.slots).toHaveProperty("label");
    expect(theme.slots).toHaveProperty("valueText");
    expect(theme.slots).toHaveProperty("view");
    expect(theme.slots).toHaveProperty("circle");
    expect(theme.slots).toHaveProperty("circleTrack");
    expect(theme.slots).toHaveProperty("circleRange");
  });

  it("sets correct default variants", () => {
    const theme = progressTheme();
    expect(theme.defaultVariants).toEqual({
      color: "primary",
      size: "md",
      type: "linear",
      orientation: "horizontal",
      indeterminate: false,
      striped: false,
      animated: false,
      inverted: false,
    });
  });

  it("supports color variants and compound variants", () => {
    const theme = progressTheme();
    expect(theme.variants.color).toHaveProperty("primary");
    expect(theme.variants.color).toHaveProperty("success");
    expect(theme.variants.color).toHaveProperty("warning");
    expect(theme.variants.color).toHaveProperty("danger");

    const primaryCompound = theme.compoundVariants.find(
      (c: any) => c.color === "primary",
    );
    expect(primaryCompound?.class).toEqual({
      range: "bg-primary",
      circleRange: "text-primary",
    });
  });

  it("supports size options from 2xs to 2xl", () => {
    const theme = progressTheme();
    expect(theme.variants.size).toHaveProperty("2xs");
    expect(theme.variants.size).toHaveProperty("xs");
    expect(theme.variants.size).toHaveProperty("sm");
    expect(theme.variants.size).toHaveProperty("md");
    expect(theme.variants.size).toHaveProperty("lg");
    expect(theme.variants.size).toHaveProperty("xl");
    expect(theme.variants.size).toHaveProperty("2xl");
  });

  it("supports type variants for linear and circular", () => {
    const theme = progressTheme();
    expect(theme.variants.type.linear).toEqual({
      root: "w-full",
      view: "hidden",
    });
    expect(theme.variants.type.circular).toEqual({
      root: "inline-flex items-center justify-center relative",
      track: "hidden",
    });
  });

  it("supports orientation variants", () => {
    const theme = progressTheme();
    expect(theme.variants.orientation.horizontal).toEqual({
      root: "w-full flex flex-col",
      track: "w-full",
      range: "h-full",
    });
    expect(theme.variants.orientation.vertical).toEqual({
      root: "h-full flex flex-row items-end",
      track: "h-full",
      range: "w-full",
    });
  });

  it("supports striped, animated, and indeterminate variants", () => {
    const theme = progressTheme();
    expect(theme.variants.striped.true).toBeDefined();
    expect(theme.variants.animated.true).toBeDefined();
    expect(theme.variants.indeterminate.true).toEqual({
      range: "animate-[progress-carousel_2s_ease-in-out_infinite]",
      circle: "animate-spin",
    });
  });
});

