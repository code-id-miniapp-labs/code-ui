import { describe, expect, it } from "vitest";
import avatarTheme from "../src/theme/definitions/avatar";
import { tv } from "../../components/src/utils/variants";

describe("Avatar Theme", () => {
  const avatar = tv(avatarTheme());

  it("applies default variants", () => {
    const result = avatar();
    expect(result.root()).toContain("size-8"); // md size
    expect(result.root()).toContain("bg-elevated"); // neutral color
  });

  it("applies size variants", () => {
    expect(avatar({ size: "3xs" }).root()).toContain("size-4");
    expect(avatar({ size: "sm" }).root()).toContain("size-7");
    expect(avatar({ size: "3xl" }).root()).toContain("size-12");
  });

  it("applies color variants", () => {
    expect(avatar({ color: "primary" }).root()).toContain("bg-primary_f10");
    expect(avatar({ color: "success" }).root()).toContain("bg-success_f10");
    expect(avatar({ color: "error" }).root()).toContain("bg-error_f10");
    expect(avatar({ color: "neutral" }).root()).toContain("bg-elevated");
  });

  it("applies color to fallback and icon slots", () => {
    const result = avatar({ color: "primary" });
    expect(result.fallback()).toContain("text-primary");
    expect(result.icon()).toContain("text-primary");

    const neutral = avatar({ color: "neutral" });
    expect(neutral.fallback()).toContain("text-muted");
    expect(neutral.icon()).toContain("text-muted");
  });
});
