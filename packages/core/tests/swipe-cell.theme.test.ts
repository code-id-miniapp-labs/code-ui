import { describe, expect, it } from "vitest";
import { swipeCellTheme } from "../src";

describe("swipeCellTheme (@code-ui/core)", () => {
  it("provides all required slots", () => {
    const theme = swipeCellTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("wrapper");
    expect(theme.slots).toHaveProperty("content");
    expect(theme.slots).toHaveProperty("left");
    expect(theme.slots).toHaveProperty("right");
    expect(theme.slots).toHaveProperty("action");
    expect(theme.slots).toHaveProperty("actionText");
    expect(theme.slots).toHaveProperty("actionIcon");
  });

  it("sets correct default variants", () => {
    const theme = swipeCellTheme();
    expect(theme.defaultVariants).toEqual({
      disabled: false,
    });
  });

  it("supports disabled variant", () => {
    const theme = swipeCellTheme();
    expect(theme.variants.disabled.true).toEqual({
      root: "opacity-60 pointer-events-none",
    });
  });
});

