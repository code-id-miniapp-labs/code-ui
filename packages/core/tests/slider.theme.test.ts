import { describe, expect, it } from "vitest";
import { sliderTheme } from "../src";

describe("sliderTheme (@code-ui/core)", () => {
  it("provides all required slots", () => {
    const theme = sliderTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("wrapper");
    expect(theme.slots).toHaveProperty("label");
    expect(theme.slots).toHaveProperty("valueText");
    expect(theme.slots).toHaveProperty("control");
    expect(theme.slots).toHaveProperty("track");
    expect(theme.slots).toHaveProperty("range");
    expect(theme.slots).toHaveProperty("thumb");
    expect(theme.slots).toHaveProperty("markerGroup");
    expect(theme.slots).toHaveProperty("marker");
    expect(theme.slots).toHaveProperty("markerTick");
    expect(theme.slots).toHaveProperty("markerLabel");
  });

  it("sets correct default variants", () => {
    const theme = sliderTheme();
    expect(theme.defaultVariants).toEqual({
      color: "primary",
      size: "md",
      orientation: "horizontal",
      disabled: false,
      invalid: false,
      dragging: false,
      hasMarkers: false,
    });
  });

  it("does not contain dark: classes", () => {
    const theme = sliderTheme();
    const str = JSON.stringify(theme);
    expect(str).not.toContain("dark:");
  });

  it("configures markerGroup as absolute inset to prevent track squishing", () => {
    const theme = sliderTheme();
    expect(theme.slots.markerGroup).toContain("absolute");
    expect(theme.slots.markerGroup).toContain("inset-0");
    expect(theme.slots.markerGroup).not.toContain("relative");
  });

  it("removes transition during dragging", () => {
    const theme = sliderTheme();
    expect(theme.variants.dragging.true).toEqual({
      range: "transition-none",
      thumb: "transition-none scale-110 shadow-lg",
    });
  });

  it("supports hasMarkers variant for bottom spacing", () => {
    const theme = sliderTheme();
    expect(theme.variants.hasMarkers.true).toEqual({
      root: "pb-5",
    });
  });
});

