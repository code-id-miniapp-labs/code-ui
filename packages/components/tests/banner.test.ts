import { describe, expect, it } from "vitest";
import { bannerTheme as createBannerTheme } from "@code-ui/core";
import { tv } from "../src/utils/variants";
import { resolveSlots } from "../src/utils/ui";

const bannerTheme = tv(createBannerTheme());

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

describe("bannerTheme runtime resolution (@code-ui/components)", () => {
  it("resolves top fixed banner classes", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "top",
        mode: "fixed",
        color: "primary",
        variant: "solid",
        size: "md",
        imagePosition: "none",
      }),
      {},
      "",
    );

    expect(slots.root).toContain("fixed");
    expect(slots.root).toContain("top-0");
    expect(slots.root).toContain("left-0");
    expect(slots.root).toContain("right-0");
    expect(slots.root).toContain("w-full");
    expect(slots.background).toContain("py-2_d5");
    expect(slots.background).toContain("px-3");
    expect(slots.background).not.toContain("min-h");
    expect(slots.title).toContain("font-medium");
    expect(slots.close).toContain("cursor-pointer");
  });

  it("resolves bottom fixed banner classes", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "bottom",
        mode: "fixed",
        color: "warning",
        variant: "solid",
        size: "md",
        imagePosition: "none",
      }),
      {},
      "",
    );

    expect(slots.root).toContain("fixed");
    expect(slots.root).toContain("bottom-0");
    expect(slots.background).toContain("bg-warning");
    expect(slots.background).toContain("text-neutral-950");
  });

  it("resolves solid primary banner with white text", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "top",
        mode: "fixed",
        color: "primary",
        variant: "solid",
        size: "md",
        imagePosition: "none",
      }),
      {},
      "",
    );

    expect(slots.background).toContain("bg-primary");
    expect(slots.background).toContain("text-white");
  });

  it("resolves inline banner classes", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "inline",
        mode: "inline",
        color: "neutral",
        variant: "outline",
        size: "md",
        imagePosition: "none",
      }),
      {},
      "",
    );

    expect(slots.root).toContain("relative");
    expect(slots.root).not.toContain("fixed");
    expect(slots.background).toContain("rounded-md");
  });

  it("resolves small banners", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "inline",
        mode: "inline",
        color: "primary",
        variant: "soft",
        size: "sm",
        imagePosition: "none",
      }),
      {},
      "",
    );

    expect(slots.background).toContain("py-2");
    expect(slots.background).toContain("px-3");
    expect(slots.background).not.toContain("min-h");
    expect(slots.title).toContain("text-xs");
    expect(slots.caption).toContain("truncate");
  });

  it("resolves xs and xl banners using py and px without height constraints", () => {
    const xsSlots = resolveSlots(
      bannerTheme({
        size: "xs",
      }),
      {},
      "",
    );
    expect(xsSlots.background).toContain("py-1_d5");
    expect(xsSlots.background).toContain("px-2_d5");
    expect(xsSlots.background).not.toContain("min-h");
    expect(xsSlots.title).toContain("text-xs");

    const xlSlots = resolveSlots(
      bannerTheme({
        size: "xl",
      }),
      {},
      "",
    );
    expect(xlSlots.background).toContain("py-3_d5");
    expect(xlSlots.background).toContain("px-4");
    expect(xlSlots.background).not.toContain("min-h");
    expect(xlSlots.title).toContain("text-lg");
  });

  it("resolves left image areas with box shapes", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "inline",
        mode: "inline",
        color: "neutral",
        variant: "outline",
        size: "md",
        imagePosition: "left",
        imageShape: "square",
      }),
      {},
      "",
    );

    expect(slots.imageArea).toContain("w-14");
    expect(slots.imageArea).toContain("h-14");
    expect(slots.imageArea).toContain("rounded-lg");
    expect(slots.image).toContain("w-full");
  });

  it("resolves background image areas", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "inline",
        mode: "inline",
        color: "neutral",
        variant: "outline",
        size: "md",
        imagePosition: "background",
        imageShape: "rect",
      }),
      {},
      "",
    );

    expect(slots.root).toContain("overflow-hidden");
    expect(slots.imageArea).toContain("absolute");
    expect(slots.imageArea).toContain("inset-0");
    expect(slots.imageArea).toContain("w-full");
    expect(slots.image).toContain("opacity-40");
    expect(slots.content).toContain("relative");
  });

  it("resolves status icons and allows prop customization", () => {
    // Default status icons
    expect(resolveIcon({ color: "info" })).toBe("info");
    expect(resolveIcon({ color: "success" })).toBe("check");
    expect(resolveIcon({ color: "warning" })).toBe("alert");
    expect(resolveIcon({ color: "error" })).toBe("close");

    // Custom status icons via props
    expect(resolveIcon({ color: "info", infoIcon: "info-circle" })).toBe(
      "info-circle",
    );
    expect(resolveIcon({ color: "success", successIcon: "check-circle" })).toBe(
      "check-circle",
    );
    expect(
      resolveIcon({ color: "warning", warningIcon: "triangle-alert" }),
    ).toBe("triangle-alert");
    expect(resolveIcon({ color: "error", errorIcon: "circle-x" })).toBe(
      "circle-x",
    );

    // Explicit icon takes highest priority
    expect(
      resolveIcon({
        color: "warning",
        icon: "megaphone",
        warningIcon: "triangle-alert",
      }),
    ).toBe("megaphone");
  });

  it("resolves actions slot with border-t and divide-x, and action slot with flex-1", () => {
    const slots = resolveSlots(
      bannerTheme({
        placement: "inline",
        mode: "inline",
        color: "neutral",
        variant: "solid",
      }),
      {},
      "",
    );

    expect(slots.actions).toContain("border-t");
    expect(slots.actions).toContain("divide-x");
    expect(slots.action).toContain("flex-1");
  });
});
