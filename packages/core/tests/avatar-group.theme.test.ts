import { describe, expect, it } from "vitest";
import { avatarGroupTheme } from "../src";

describe("avatarGroupTheme (@code-ui/core)", () => {
  it("provides root, base, and counter slots", () => {
    const theme = avatarGroupTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("base");
    expect(theme.slots).toHaveProperty("counter");

    expect(theme.slots.root).toBe(
      "inline-flex flex-row-reverse justify-end items-center",
    );
    expect(theme.slots.base).toBe(
      "relative rounded-full ring-bg ring-2 first:me-0",
    );
    expect(theme.slots.counter).toBe("font-semibold tracking-tight");
  });

  it("sets correct default variants", () => {
    const theme = avatarGroupTheme();
    expect(theme.defaultVariants).toEqual({
      size: "md",
    });
  });

  it("supports all 9 size variants with matching ring, margin offsets, and counter scaling", () => {
    const theme = avatarGroupTheme();
    expect(theme.variants.size["3xs"]).toEqual({
      base: "ring -me-0.5",
      counter: "text-[14rpx] ps-0.5",
    });
    expect(theme.variants.size["2xs"]).toEqual({
      base: "ring -me-0.5",
      counter: "text-[16rpx] ps-0.5",
    });
    expect(theme.variants.size.xs).toEqual({
      base: "ring -me-0.5",
      counter: "text-[18rpx] ps-0.5",
    });
    expect(theme.variants.size.sm).toEqual({
      base: "ring-2 -me-1",
      counter: "text-[20rpx] ps-0.5",
    });
    expect(theme.variants.size.md).toEqual({
      base: "ring-2 -me-1.5",
      counter: "text-xs ps-1",
    });
    expect(theme.variants.size.lg).toEqual({
      base: "ring-2 -me-1.5",
      counter: "text-xs ps-1",
    });
    expect(theme.variants.size.xl).toEqual({
      base: "ring-3 -me-2",
      counter: "text-sm ps-1.5",
    });
    expect(theme.variants.size["2xl"]).toEqual({
      base: "ring-3 -me-2",
      counter: "text-base ps-1.5",
    });
    expect(theme.variants.size["3xl"]).toEqual({
      base: "ring-3 -me-2",
      counter: "text-lg ps-1.5",
    });
  });
});
