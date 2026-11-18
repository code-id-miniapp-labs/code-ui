import { describe, it, expect, vi, beforeEach } from "vitest";
import { __resetThemeRegistry } from "@code-ui/miniapp/behaviors/theme";
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
});
