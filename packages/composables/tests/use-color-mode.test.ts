import { describe, it, expect, vi, beforeEach } from "vitest";
import { __resetThemeRegistry } from "@code-id-labs/miniapp/behaviors/theme";
import { useColorMode } from "../src/use-color-mode";

describe("useColorMode Composable", () => {
  beforeEach(() => {
    __resetThemeRegistry();
  });

  it("reads and updates color mode and toggles between light and dark", () => {
    const colorMode = useColorMode();

    expect(colorMode.resolvedMode).toBe("light");

    colorMode.setMode("dark");
    expect(colorMode.mode).toBe("dark");
    expect(colorMode.resolvedMode).toBe("dark");

    colorMode.toggle();
    expect(colorMode.mode).toBe("light");
    expect(colorMode.resolvedMode).toBe("light");
  });

  it("syncs theme state to target.setData and fires onChange", () => {
    const setData = vi.fn();
    const onChange = vi.fn();
    const page = { setData };

    const colorMode = useColorMode({
      target: page,
      key: "theme",
      initialValue: "dark",
      onChange,
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        colorMode: "dark",
        resolvedMode: "dark",
      }),
    );
    expect(setData).toHaveBeenCalledWith({
      theme: expect.objectContaining({
        colorMode: "dark",
        resolvedMode: "dark",
      }),
    });

    colorMode.setMode("light");
    expect(setData).toHaveBeenLastCalledWith({
      theme: expect.objectContaining({
        colorMode: "light",
        resolvedMode: "light",
      }),
    });

    colorMode.stop();
    setData.mockClear();
    colorMode.setMode("dark");
    expect(setData).not.toHaveBeenCalled();
  });

  it("auto-unsubscribes on target.onUnload and avoids nested wrapper chains", () => {
    const setData = vi.fn();
    const origOnUnload = vi.fn();
    const page: Record<string, any> = { setData, onUnload: origOnUnload };

    const first = useColorMode({ target: page, key: "theme" });
    const wrappedOnce = page.onUnload;
    const second = useColorMode({ target: page, key: "theme2" });
    // Single shared dispatcher wraps onUnload at most once
    expect(page.onUnload).toBe(wrappedOnce);

    const reg = (globalThis as any).__CODE_UI_THEME_REGISTRY__;
    expect(reg.listeners.size).toBe(2);

    first.stop();
    expect(reg.listeners.size).toBe(1);

    page.onUnload();
    expect(origOnUnload).toHaveBeenCalledTimes(1);
    expect(reg.listeners.size).toBe(0);

    setData.mockClear();
    second.setMode("dark");
    expect(setData).not.toHaveBeenCalled();
  });
});
