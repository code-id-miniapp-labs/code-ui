import { beforeEach, describe, expect, it } from "vitest";
import { resetConfig } from "@code-ui/core";
import { __resetThemeRegistry } from "@code-ui/miniapp/behaviors/theme";
import { useTheme } from "../src/use-theme";

describe("useTheme composable", () => {
  beforeEach(() => {
    __resetThemeRegistry();
    resetConfig();
  });

  it("exposes live theme state getters and controls", () => {
    const theme = useTheme();
    expect(theme.colorMode).toBe("system");
    expect(theme.resolvedMode).toBe("light");
    expect(theme.isDark).toBe(false);
    expect(theme.colors).toEqual({});

    theme.toggleColorMode();
    expect(theme.isDark).toBe(true);
    expect(theme.resolvedMode).toBe("dark");

    theme.setColors({ primary: "#ec4899" });
    expect(theme.colors).toEqual({ primary: "#ec4899" });
    expect(theme.cssVars).toContain("--ui-color-primary-500:#ec4899");

    theme.reset();
    expect(theme.isDark).toBe(false);
    expect(theme.colors).toEqual({});
    expect(theme.cssVars).toBe("");
  });
});
