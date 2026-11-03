import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_COLORS, toastTheme } from "../src";

describe("toastTheme (@code-ui/core)", () => {
  it("provides all required slots", () => {
    const theme = toastTheme();
    expect(theme.slots).toHaveProperty("root");
    expect(theme.slots).toHaveProperty("wrapper");
    expect(theme.slots).toHaveProperty("title");
    expect(theme.slots).toHaveProperty("description");
    expect(theme.slots).toHaveProperty("icon");
    expect(theme.slots).toHaveProperty("actions");
    expect(theme.slots).toHaveProperty("action");
    expect(theme.slots).toHaveProperty("closeTrigger");
    expect(theme.slots).toHaveProperty("progress");
  });

  it("sets correct default variants", () => {
    const theme = toastTheme();
    expect(theme.defaultVariants).toEqual({
      mode: "default",
      color: "neutral",
      variant: "outline",
      orientation: "horizontal",
      placement: "top",
    });
  });

  it("configures placement variants with CSS variable offsets", () => {
    const theme = toastTheme();
    expect(theme.variants.placement.top.root).toContain("fixed top-0 left-1/2 -translate-x-1/2");
    expect(theme.variants.placement.top.root).toContain("--cui-toast-top-offset");

    expect(theme.variants.placement.center.root).toContain("fixed top-1/2 left-1/2");

    expect(theme.variants.placement.bottom.root).toContain("fixed bottom-0 left-1/2 -translate-x-1/2");
    expect(theme.variants.placement.bottom.root).toContain("--cui-toast-bottom-offset");
  });

  it("configures compound variants for native mode placements", () => {
    const theme = toastTheme();
    const nativeTop = theme.compoundVariants.find(
      (cv) => cv.mode === "native" && cv.placement === "top",
    );
    const nativeCenter = theme.compoundVariants.find(
      (cv) => cv.mode === "native" && cv.placement === "center",
    );
    const nativeBottom = theme.compoundVariants.find(
      (cv) => cv.mode === "native" && cv.placement === "bottom",
    );

    expect(nativeTop?.class?.root).toContain("fixed top-0 left-1/2 -translate-x-1/2");
    expect(nativeTop?.class?.root).toContain("calc(var(--cui-toast-top-offset,env(safe-area-inset-top,0px))+32rpx)");
    expect(nativeCenter?.class?.root).toContain("fixed top-1/2 left-1/2 -translate-x-1/2");
    expect(nativeBottom?.class?.root).toContain("fixed bottom-0 left-1/2 -translate-x-1/2");
    expect(nativeBottom?.class?.root).toContain("calc(var(--cui-toast-bottom-offset,env(safe-area-inset-bottom,0px))+32rpx)");
  });

  it("creates color variants for default theme colors", () => {
    const theme = toastTheme();
    expect(Object.keys(theme.variants.color)).toEqual(DEFAULT_THEME_COLORS);
  });
});

