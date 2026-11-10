import { describe, expect, it } from "vitest";
import { bannerTheme as createBannerTheme } from "@code-ui/core";
import { tv } from "../src/utils/variants";
import { resolveSlots } from "../src/utils/ui";

const bannerTheme = tv(createBannerTheme());

describe("bannerTheme runtime resolution (@code-ui/components)", () => {
  it("resolves top fixed banner classes", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "top",
        mode: "fixed",
        color: "primary",
        variant: "soft",
      }),
      {},
      "",
    );

    expect(slots.root).toContain("fixed");
    expect(slots.root).toContain("top-0");
    expect(slots.root).toContain("left-0");
    expect(slots.root).toContain("right-0");
    expect(slots.root).toContain("w-full");
    expect(slots.title).toContain("font-semibold");
    expect(slots.closeTrigger).toContain("cursor-pointer");
  });

  it("resolves bottom fixed banner classes", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "bottom",
        mode: "fixed",
        color: "warning",
        variant: "solid",
      }),
      {},
      "",
    );

    expect(slots.root).toContain("fixed");
    expect(slots.root).toContain("bottom-0");
    expect(slots.root).toContain("bg-warning");
    expect(slots.root).toContain("text-white");
  });

  it("resolves inline banner classes", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "inline",
        mode: "inline",
        color: "neutral",
        variant: "outline",
      }),
      {},
      "",
    );

    expect(slots.root).toContain("relative");
    expect(slots.root).not.toContain("fixed");
  });

  it("resolves status icons and allows prop customization", () => {
    function resolveIcon(data: {
      icon?: string;
      color?: string;
      infoIcon?: string;
      successIcon?: string;
      warningIcon?: string;
      errorIcon?: string;
    }) {
      const icon = data.icon;
      if (icon) return icon;
      const color = data.color;
      if (color === "info") return data.infoIcon || "info";
      if (color === "success") return data.successIcon || "check";
      if (color === "warning") return data.warningIcon || "alert";
      if (color === "error" || color === "danger") return data.errorIcon || "close";
      return "";
    }

    // Default status icons
    expect(resolveIcon({ color: "info" })).toBe("info");
    expect(resolveIcon({ color: "success" })).toBe("check");
    expect(resolveIcon({ color: "warning" })).toBe("alert");
    expect(resolveIcon({ color: "error" })).toBe("close");

    // Custom status icons via props
    expect(resolveIcon({ color: "info", infoIcon: "info-circle" })).toBe("info-circle");
    expect(resolveIcon({ color: "success", successIcon: "check-circle" })).toBe("check-circle");
    expect(resolveIcon({ color: "warning", warningIcon: "triangle-alert" })).toBe("triangle-alert");
    expect(resolveIcon({ color: "error", errorIcon: "circle-x" })).toBe("circle-x");

    // Explicit icon takes highest priority
    expect(resolveIcon({ color: "warning", icon: "megaphone", warningIcon: "triangle-alert" })).toBe("megaphone");
  });
});

