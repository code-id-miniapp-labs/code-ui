import { describe, expect, it } from "vitest";
import { avatarGroupTheme as createAvatarGroupTheme } from "@code-ui/core";
import { tv } from "../src/utils/variants";
import { resolveSlots } from "../src/utils/ui";

const avatarGroupTheme = tv(createAvatarGroupTheme());

describe("avatarGroupTheme runtime resolution (@code-ui/components)", () => {
  it("resolves default avatar group slots", () => {
    const theme = avatarGroupTheme();
    const slots = resolveSlots(theme, {}, "");

    expect(slots.root).toContain("inline-flex");
    expect(slots.root).toContain("flex-row-reverse");
    expect(slots.root).toContain("justify-end");
    expect(slots.root).toContain("items-center");

    expect(slots.base).toContain("relative");
    expect(slots.base).toContain("rounded-full");
    expect(slots.base).toContain("ring-2");
    expect(slots.base).toContain("ring-bg");
    expect(slots.base).toContain("-me-1_d5");

    expect(slots.counter).toContain("font-semibold");
    expect(slots.counter).toContain("tracking-tight");
    expect(slots.counter).toContain("text-xs");
    expect(slots.counter).toContain("ps-1");
  });

  it("resolves size variants correctly", () => {
    const smSlots = resolveSlots(avatarGroupTheme({ size: "sm" }), {}, "");
    expect(smSlots.base).toContain("-me-1");
    expect(smSlots.counter).toContain("ps-0_d5");

    const lgSlots = resolveSlots(avatarGroupTheme({ size: "lg" }), {}, "");
    expect(lgSlots.base).toContain("-me-1_d5");
    expect(lgSlots.counter).toContain("ps-1");

    const xlSlots = resolveSlots(avatarGroupTheme({ size: "xl" }), {}, "");
    expect(xlSlots.base).toContain("-me-2");
    expect(xlSlots.base).toContain("ring-3");
    expect(xlSlots.counter).toContain("ps-1_d5");
  });

  it("supports custom class and ui overrides", () => {
    const theme = avatarGroupTheme();
    const slots = resolveSlots(
      theme,
      { root: "custom-root", base: "custom-base" },
      "extra-class",
    );

    expect(slots.root).toContain("custom-root");
    expect(slots.root).toContain("extra-class");
    expect(slots.base).toContain("custom-base");
  });
});
