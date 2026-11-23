import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetPageLifecycleHub,
  emitPageLifecycle,
} from "../src/behaviors/page-lifecycle";
import {
  __resetThemeRegistry,
  createAppThemeBehavior,
  getAppTheme,
  subscribeAppTheme,
} from "../src/behaviors/theme";

describe("theme behavior", () => {
  beforeEach(() => {
    __resetThemeRegistry();
    __resetPageLifecycleHub();
    delete (globalThis as Record<string, unknown>).wx;
  });

  it("tracks system theme changes via wx.onThemeChange and notifies subscribers", () => {
    let onChangeCb: ((res: { theme: string }) => void) | undefined;
    (globalThis as Record<string, unknown>).wx = {
      getAppBaseInfo: () => ({ theme: "light" }),
      onThemeChange: (cb: (res: { theme: string }) => void) => {
        onChangeCb = cb;
      },
    };

    const events: string[] = [];
    const unsub = subscribeAppTheme((state) => {
      events.push(`${state.colorMode}:${state.resolvedMode}`);
    }, true);

    expect(events).toEqual(["system:light"]);

    onChangeCb?.({ theme: "dark" });
    expect(getAppTheme().resolvedMode).toBe("dark");
    expect(events).toEqual(["system:light", "system:dark"]);

    unsub();
    onChangeCb?.({ theme: "light" });
    expect(events).toEqual(["system:light", "system:dark"]);
  });

  it("syncs mounted component via createAppThemeBehavior without declaring pageLifetimes", () => {
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
        pageLifetimes?: Record<string, unknown>;
      };

      expect(behavior.pageLifetimes).toBeUndefined();

      const setData = vi.fn();
      const instance: Record<string, unknown> = {
        getPageId: () => "page-theme-1",
        data: { themeMode: "light", themeCssVars: "" },
        setData,
      };

      behavior.lifetimes.attached.call(instance);
      expect(setData).toHaveBeenCalledWith({
        themeMode: "light",
        themeCssVars: "",
      });

      const reg = (
        globalThis as Record<string, any>
      ).__CODE_UI_THEME_REGISTRY__;
      reg.colorMode = "dark";
      reg.cssVars = "--ui-primary:#10b981;";
      emitPageLifecycle("page-theme-1", "show");

      expect(setData).toHaveBeenLastCalledWith({
        themeMode: "dark",
        themeCssVars: "--ui-primary:#10b981;",
      });

      behavior.lifetimes.detached.call(instance);
    } finally {
      if (originalBehavior === undefined) {
        delete (globalThis as Record<string, unknown>).Behavior;
      } else {
        (globalThis as Record<string, unknown>).Behavior = originalBehavior;
      }
    }
  });
});
