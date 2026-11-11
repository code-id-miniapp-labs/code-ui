import { describe, expect, it, vi } from "vitest";
import type { AppMetrics } from "@code-ui/miniapp/behaviors/app";
import {
  BOTTOM_BAR_KEY,
  BOTTOM_BAR_SELECTOR,
  TOP_BAR_KEY,
  TOP_BAR_SELECTOR,
  buildRootCssVars,
  detectBars,
  extractBottomBarHeight,
  extractTopBarHeight,
  hasEdge,
  px,
  resolveAppLayout,
  runBarsQuery,
  runTabBarQuery,
} from "../src/runtime/app/utils";

const mockMetrics: AppMetrics = {
  windowWidth: 375,
  windowHeight: 812,
  statusBarHeight: 44,
  safeTop: 44,
  safeBottom: 34,
  menuTop: 48,
  menuHeight: 32,
  menuInset: 94,
  navBarHeight: 40,
  navHeight: 84,
};

describe("app runtime layout utils (resolveAppLayout)", () => {
  it("formats pixel values cleanly", () => {
    expect(px(0)).toBe("0px");
    expect(px(44)).toBe("44px");
    expect(px(88.456)).toBe("88.46px");
  });

  it("checks safe area edges correctly", () => {
    expect(hasEdge("both", "top")).toBe(true);
    expect(hasEdge("both", "bottom")).toBe(true);
    expect(hasEdge("top", "top")).toBe(true);
    expect(hasEdge("top", "bottom")).toBe(false);
    expect(hasEdge("bottom", "bottom")).toBe(true);
    expect(hasEdge("bottom", "top")).toBe(false);
    expect(hasEdge("none", "top")).toBe(false);
    expect(hasEdge(undefined, "top")).toBe(false);
  });

  describe("Scenario 1: Default navigation bar, safeArea=none", () => {
    it("returns zero top offsets when no custom bars and no banner is present", () => {
      const result = resolveAppLayout({
        safeArea: "none",
        metrics: mockMetrics,
        topBarHeight: 0,
        bottomBarHeight: 0,
        detectedTopBarHeight: 0,
        detectedBottomBarHeight: 0,
        topInset: 0,
        bottomInset: 0,
      });

      expect(result.effectiveTopBarHeight).toBe(0);
      expect(result.effectiveBottomBarHeight).toBe(0);
      expect(result.bannerTopOffset).toBe(0);
      expect(result.topOffset).toBe(0);
      expect(result.bottomOffset).toBe("0px");
    });

    it("pads page top by banner height when banner opens below default navigation bar", () => {
      const result = resolveAppLayout({
        safeArea: "none",
        metrics: mockMetrics,
        topBarHeight: 0,
        bottomBarHeight: 0,
        detectedTopBarHeight: 0,
        detectedBottomBarHeight: 0,
        topInset: 52,
        bottomInset: 0,
      });

      // Top banner is placed at 0px (directly below WeChat system nav bar)
      expect(result.bannerTopOffset).toBe(0);
      // Page content is padded down by 52px so it doesn't get covered by the banner
      expect(result.topOffset).toBe(52);
    });
  });

  describe("Scenario 2: Custom top-bar without banner component added", () => {
    it("pads container content by custom top-bar height even when no banner component is present", () => {
      const result = resolveAppLayout({
        safeArea: "none",
        metrics: mockMetrics,
        topBarHeight: 0,
        detectedTopBarHeight: 88,
        bottomBarHeight: 0,
        detectedBottomBarHeight: 0,
        topInset: 0,
        bottomInset: 0,
      });

      expect(result.effectiveTopBarHeight).toBe(88);
      expect(result.bannerTopOffset).toBe(88);
      // Container content receives 88px padding so content is not obscured by the fixed top bar
      expect(result.topOffset).toBe(88);
      expect(result.toastTopOffset).toBe(88);
    });
  });

  describe("Scenario 3: Custom top-bar with banner component open", () => {
    it("positions banner at bottom of custom top-bar and offsets container content by both", () => {
      const result = resolveAppLayout({
        safeArea: "none",
        metrics: mockMetrics,
        topBarHeight: 0,
        detectedTopBarHeight: 88,
        bottomBarHeight: 0,
        detectedBottomBarHeight: 0,
        topInset: 50,
        bottomInset: 0,
      });

      expect(result.effectiveTopBarHeight).toBe(88);
      // Banner sits directly below top-bar at 88px
      expect(result.bannerTopOffset).toBe(88);
      // Content is padded by 88px (top bar) + 50px (banner) = 138px
      expect(result.topOffset).toBe(138);
      expect(result.toastTopOffset).toBe(138);
    });
  });

  describe("Scenario 4: Custom top-bar with safeArea=top (no double counting)", () => {
    it("does not double count safeTop when custom top-bar is detected", () => {
      const result = resolveAppLayout({
        safeArea: "top",
        metrics: mockMetrics,
        topBarHeight: 0,
        detectedTopBarHeight: 88,
        topInset: 0,
      });

      expect(result.effectiveTopBarHeight).toBe(88);
      expect(result.bannerTopOffset).toBe(88);
      expect(result.topOffset).toBe(88);
    });

    it("falls back to safeTop when no custom top-bar is present but safeArea=top", () => {
      const result = resolveAppLayout({
        safeArea: "top",
        metrics: mockMetrics,
        topBarHeight: 0,
        detectedTopBarHeight: 0,
        topInset: 0,
      });

      expect(result.effectiveTopBarHeight).toBe(0);
      expect(result.bannerTopOffset).toBe(44);
      expect(result.topOffset).toBe(44);
    });
  });

  describe("Scenario 5: Manual topBarHeight and bottomBarHeight props precedence", () => {
    it("gives priority to manual prop over detected DOM height", () => {
      const result = resolveAppLayout({
        metrics: mockMetrics,
        topBarHeight: 96,
        detectedTopBarHeight: 88,
        bottomBarHeight: 64,
        detectedBottomBarHeight: 56,
      });

      expect(result.effectiveTopBarHeight).toBe(96);
      expect(result.effectiveBottomBarHeight).toBe(64);
      expect(result.bannerTopOffset).toBe(96);
      expect(result.bannerBottomOffset).toBe("64px");
    });
  });

  describe("Scenario 6: Custom bottom-bar and bottom banner placement", () => {
    it("positions bottom banner directly above custom bottom-bar and pads container", () => {
      const result = resolveAppLayout({
        safeArea: "none",
        metrics: mockMetrics,
        bottomBarHeight: 0,
        detectedBottomBarHeight: 56,
        bottomInset: 48,
      });

      expect(result.effectiveBottomBarHeight).toBe(56);
      expect(result.bannerBottomOffset).toBe("56px");
      expect(result.bottomOffset).toBe("104px");
    });

    it("handles bottom banner without bottom-bar, falling back to safe-area-inset-bottom", () => {
      const result = resolveAppLayout({
        safeArea: "none",
        metrics: mockMetrics,
        bottomBarHeight: 0,
        detectedBottomBarHeight: 0,
        bottomInset: 48,
      });

      expect(result.bannerBottomOffset).toBe("env(safe-area-inset-bottom, 0px)");
      expect(result.bottomOffset).toBe("calc(env(safe-area-inset-bottom, 0px) + 48px)");
    });
  });

  describe("buildRootCssVars", () => {
    it("generates complete CSS variables string with identical layout values", () => {
      const layout = resolveAppLayout({
        safeArea: "none",
        metrics: mockMetrics,
        detectedTopBarHeight: 88,
        detectedBottomBarHeight: 56,
        topInset: 50,
        bottomInset: 48,
      });

      const css = buildRootCssVars(layout, mockMetrics, 50, 48);

      expect(css).toContain("--cui-top-bar-height:88px;");
      expect(css).toContain("--cui-bottom-bar-height:56px;");
      expect(css).toContain("--cui-banner-top-offset:88px;");
      expect(css).toContain("--cui-banner-bottom-offset:56px;");
      expect(css).toContain("--cui-top-offset:138px;");
      expect(css).toContain("--cui-bottom-offset:104px;");
      expect(css).toContain("padding-top:var(--cui-top-offset);");
      expect(css).toContain("padding-bottom:var(--cui-bottom-offset);");
    });
  });
});

describe("app runtime bar detection utils (bar.ts)", () => {
  it("defines one canonical ID and selector for top-bar and bottom-bar", () => {
    expect(TOP_BAR_KEY).toBe("cui-top-bar");
    expect(BOTTOM_BAR_KEY).toBe("cui-bottom-bar");
    expect(TOP_BAR_SELECTOR).toBe("#cui-top-bar");
    expect(BOTTOM_BAR_SELECTOR).toBe("#cui-bottom-bar");
  });

  it("extracts top bar height accurately for normal, offset, and scrolled bars", () => {
    expect(extractTopBarHeight(null)).toBe(0);
    expect(extractTopBarHeight(undefined)).toBe(0);
    expect(extractTopBarHeight({ height: 0 })).toBe(0);

    // Normal fixed bar at top: 0
    expect(extractTopBarHeight({ top: 0, height: 88 })).toBe(88);

    // Offset bar placed under status bar (top: 44, height: 44)
    expect(extractTopBarHeight({ top: 44, height: 44 })).toBe(88);

    // Page scrolled so top < 0, still preserves height
    expect(extractTopBarHeight({ top: -20, height: 88 })).toBe(88);
  });

  it("extracts bottom bar height accurately", () => {
    expect(extractBottomBarHeight(null)).toBe(0);
    expect(extractBottomBarHeight(undefined)).toBe(0);
    expect(extractBottomBarHeight({ height: 0 })).toBe(0);
    expect(extractBottomBarHeight({ height: 56.4 })).toBe(56);
  });

  it("queries custom bars using canonical ID selectors", () => {
    const selectMock = vi.fn().mockReturnValue({
      boundingClientRect: vi.fn(),
    });
    const execMock = vi.fn();
    const query = {
      select: selectMock,
      exec: execMock,
    };

    runBarsQuery(query, vi.fn());

    expect(selectMock).toHaveBeenCalledWith(TOP_BAR_SELECTOR);
    expect(selectMock).toHaveBeenCalledWith(BOTTOM_BAR_SELECTOR);
    expect(execMock).toHaveBeenCalled();
  });

  describe("native custom-tab-bar detection", () => {
    it("queries custom tab-bar strictly using canonical #cui-bottom-bar ID", () => {
      const selectMock = vi.fn().mockReturnValue({
        boundingClientRect: vi.fn(),
      });
      const execMock = vi.fn((cb) => {
        cb([{ height: 56, top: 756 }]);
      });
      const query = {
        select: selectMock,
        exec: execMock,
      };

      const cb = vi.fn();
      runTabBarQuery(query, cb);

      expect(selectMock).toHaveBeenCalledTimes(1);
      expect(selectMock).toHaveBeenCalledWith(BOTTOM_BAR_SELECTOR);
      expect(cb).toHaveBeenCalledWith({ height: 56, top: 756 });
    });

    it("detectBars integrates native tab-bar rect alongside page top-bar rect", () => {
      // Mock global getCurrentPages with a page that has getTabBar()
      const mockTabBar = {
        createSelectorQuery: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            boundingClientRect: vi.fn(),
          }),
          exec: vi.fn((cb) => {
            cb([{ height: 56, top: 756 }]);
          }),
        }),
      };

      const mockPage = {
        getTabBar: vi.fn().mockReturnValue(mockTabBar),
        createSelectorQuery: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            boundingClientRect: vi.fn(),
          }),
          exec: vi.fn((cb) => {
            cb([{ height: 88, top: 0 }, null]);
          }),
        }),
      };

      vi.stubGlobal("getCurrentPages", () => [mockPage]);

      const cb = vi.fn();
      detectBars({}, cb);

      expect(cb).toHaveBeenCalledWith({
        topRect: { height: 88, top: 0 },
        bottomRect: { height: 56, top: 756 },
      });

      vi.unstubAllGlobals();
    });

    it("detectBars falls back to in-page bottom bar when getTabBar is null", () => {
      const mockPage = {
        getTabBar: vi.fn().mockReturnValue(null),
        createSelectorQuery: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            boundingClientRect: vi.fn(),
          }),
          exec: vi.fn((cb) => {
            cb([
              { height: 88, top: 0 },
              { height: 64, top: 748 },
            ]);
          }),
        }),
      };

      vi.stubGlobal("getCurrentPages", () => [mockPage]);

      const cb = vi.fn();
      detectBars({}, cb);

      expect(cb).toHaveBeenCalledWith({
        topRect: { height: 88, top: 0 },
        bottomRect: { height: 64, top: 748 },
      });

      vi.unstubAllGlobals();
    });
  });
});

