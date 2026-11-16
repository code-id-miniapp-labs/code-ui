import { beforeEach, describe, expect, it, vi } from "vitest";
import { getColors, resetConfig } from "@code-ui/core";
import {
  __resetThemeRegistry,
  buildThemeCssVars,
  createAppThemeBehavior,
  getAppTheme,
  resetAppTheme,
  resolveThemePaletteHex,
  setAppColorMode,
  setAppTheme,
  setAppThemeColors,
  subscribeAppTheme,
  toggleAppColorMode,
} from "../src/behaviors/theme";

describe("theme behavior", () => {
  beforeEach(() => {
    __resetThemeRegistry();
    resetConfig();
  });

  it("resolves named palettes and hex strings safely", () => {
    expect(resolveThemePaletteHex("emerald")).toBe("#10b981");
    expect(resolveThemePaletteHex("INDIGO")).toBe("#6366f1");
    expect(resolveThemePaletteHex("#38f")).toBe("#3388ff");
    expect(resolveThemePaletteHex(" #1A2B3C ")).toBe("#1a2b3c");
    expect(resolveThemePaletteHex("not-a-color")).toBeNull();
    expect(resolveThemePaletteHex("")).toBeNull();
  });

  it("builds light and dark CSS variables for semantic roles", () => {
    const lightVars = buildThemeCssVars({ primary: "#10b981" }, "light");
    expect(lightVars).toContain("--ui-color-primary-500:#10b981");
    expect(lightVars).toContain("--ui-primary:#10b981");
    expect(lightVars).toContain("--ui-primary-a10:rgba(16,185,129,0.1)");

    const darkVars = buildThemeCssVars({ primary: "#10b981" }, "dark");
    expect(darkVars).toContain("--ui-color-primary-400:");
    expect(darkVars).not.toContain("--ui-primary:#10b981;");
    expect(darkVars).toContain("--ui-primary-a20:rgba(");

    const neutralVars = buildThemeCssVars({ neutral: "slate" }, "light");
    expect(neutralVars).toContain("--ui-color-neutral-500:#64748b");
    expect(neutralVars).not.toContain("--ui-neutral:");
  });

  it("updates colorMode, toggles mode, and notifies subscribers", () => {
    const events: string[] = [];
    const unsub = subscribeAppTheme((state) => {
      events.push(`${state.colorMode}:${state.resolvedMode}`);
    }, true);

    expect(events).toEqual(["system:light"]);

    setAppColorMode("dark");
    expect(getAppTheme().resolvedMode).toBe("dark");

    toggleAppColorMode();
    expect(getAppTheme().resolvedMode).toBe("light");

    unsub();
    setAppColorMode("dark");
    expect(events).toEqual(["system:light", "dark:dark", "light:light"]);
  });

  it("merges, replaces, resets colors and syncs @code-ui/core getColors()", () => {
    setAppThemeColors({ primary: "emerald" });
    expect(getAppTheme().colors).toEqual({ primary: "emerald" });
    expect(getColors().primary).toBe("#10b981");

    setAppThemeColors({ secondary: "#6366f1" });
    expect(getAppTheme().colors).toEqual({
      primary: "emerald",
      secondary: "#6366f1",
    });
    expect(getColors().secondary).toBe("#6366f1");

    setAppThemeColors({ danger: "rose" }, { merge: false });
    expect(getAppTheme().colors).toEqual({ danger: "rose" });
    expect(getColors().primary).toBeUndefined();
    expect(getColors().danger).toBe("#f43f5e");

    resetAppTheme();
    expect(getAppTheme().colors).toEqual({});
    expect(getAppTheme().cssVars).toBe("");
    expect(getColors().danger).toBeUndefined();
  });

  it("rebuilds theme CSS variables when colorMode flips between light and dark", () => {
    setAppTheme({ colorMode: "light", colors: { primary: "#10b981" } });
    const lightCss = getAppTheme().cssVars;
    expect(lightCss).toContain("--ui-primary:#10b981");

    setAppColorMode("dark");
    const darkCss = getAppTheme().cssVars;
    expect(darkCss).not.toBe(lightCss);
    expect(darkCss).toContain("--ui-color-primary-500:#10b981");
  });

  it("syncs mounted component via createAppThemeBehavior lifetimes", () => {
    const originalBehavior = (globalThis as Record<string, unknown>).Behavior;
    (globalThis as Record<string, unknown>).Behavior = (
      def: Record<string, unknown>,
    ) => def;

    try {
      const behavior = createAppThemeBehavior() as unknown as {
        lifetimes: {
          attached: (this: Record<string, unknown>) => void;
          detached: (this: Record<string, unknown>) => void;
        };
        pageLifetimes: {
          show: (this: Record<string, unknown>) => void;
        };
      };

      const setData = vi.fn();
      const instance: Record<string, unknown> = {
        data: { themeMode: "light", themeCssVars: "" },
        setData: (patch: Record<string, unknown>) => {
          Object.assign(instance.data as Record<string, unknown>, patch);
          setData(patch);
        },
      };

      behavior.lifetimes.attached.call(instance);
      expect(setData).toHaveBeenLastCalledWith({
        themeMode: "light",
        themeCssVars: "",
      });

      setAppTheme({ colorMode: "dark", colors: { primary: "blue" } });
      expect(setData).toHaveBeenLastCalledWith(
        expect.objectContaining({
          themeMode: "dark",
          themeCssVars: expect.stringContaining("--ui-color-primary-500:#3b82f6"),
        }),
      );

      behavior.lifetimes.detached.call(instance);
      setData.mockClear();
      setAppColorMode("light");
      expect(setData).not.toHaveBeenCalled();

      behavior.pageLifetimes.show.call(instance);
      expect(setData).toHaveBeenCalledWith(
        expect.objectContaining({ themeMode: "light" }),
      );
    } finally {
      (globalThis as Record<string, unknown>).Behavior = originalBehavior;
    }
  });
});
