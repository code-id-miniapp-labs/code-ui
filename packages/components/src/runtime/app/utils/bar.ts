/**
 * Custom top-bar and bottom-bar detection constants and helpers.
 *
 * Single canonical ID key across Code UI:
 * - Top-bar: `id="cui-top-bar"` (selector: `#cui-top-bar`)
 * - Bottom-bar: `id="cui-bottom-bar"` (selector: `#cui-bottom-bar`)
 */

export const TOP_BAR_ID = "cui-top-bar";
export const BOTTOM_BAR_ID = "cui-bottom-bar";

export const TOP_BAR_KEY = TOP_BAR_ID;
export const BOTTOM_BAR_KEY = BOTTOM_BAR_ID;

export const TOP_BAR_SELECTOR = `#${TOP_BAR_ID}`;
export const BOTTOM_BAR_SELECTOR = `#${BOTTOM_BAR_ID}`;

export interface BarBoundingRect {
  top?: number | undefined;
  bottom?: number | undefined;
  height?: number | undefined;
}

/**
 * Extract effective top-bar height from DOM BoundingClientRect.
 * If the element starts below top: 0 (e.g. placed under status bar), includes that top offset.
 * If the page is scrolled (top < 0), preserves the true height.
 */
export function extractTopBarHeight(rect?: BarBoundingRect | null): number {
  if (!rect || typeof rect.height !== "number" || rect.height <= 0) {
    return 0;
  }
  const height = Math.round(rect.height);
  const top = typeof rect.top === "number" ? Math.round(rect.top) : 0;
  const effective = top > 0 ? top + height : height;
  return Math.max(0, effective);
}

/**
 * Extract effective bottom-bar height from DOM BoundingClientRect.
 */
export function extractBottomBarHeight(rect?: BarBoundingRect | null): number {
  if (!rect || typeof rect.height !== "number" || rect.height <= 0) {
    return 0;
  }
  return Math.max(0, Math.round(rect.height));
}

/**
 * Resolve SelectorQuery instance from current top page or global wx.
 */
export function getPageQuery(): any {
  if (typeof getCurrentPages === "function") {
    try {
      const pages = getCurrentPages();
      const curPage = pages && pages[pages.length - 1];
      if (curPage && typeof curPage.createSelectorQuery === "function") {
        return curPage.createSelectorQuery();
      }
    } catch {}
  }
  if (typeof wx !== "undefined" && typeof wx.createSelectorQuery === "function") {
    return wx.createSelectorQuery();
  }
  return null;
}

/**
 * Retrieve the current page's custom tab-bar component instance if present.
 */
export function getCustomTabBarInstance(): any {
  if (typeof getCurrentPages === "function") {
    try {
      const pages = getCurrentPages();
      const curPage = pages && pages[pages.length - 1];
      if (curPage && typeof curPage.getTabBar === "function") {
        return curPage.getTabBar();
      }
    } catch {}
  }
  return null;
}

/**
 * Resolve SelectorQuery instance from custom tab-bar component instance.
 */
export function getTabBarQuery(tabBar: any): any {
  if (!tabBar) return null;
  if (typeof tabBar.createSelectorQuery === "function") {
    return tabBar.createSelectorQuery();
  }
  if (
    typeof wx !== "undefined" &&
    typeof wx.createSelectorQuery === "function"
  ) {
    try {
      return wx.createSelectorQuery().in(tabBar);
    } catch {}
  }
  return null;
}

/**
 * Query custom tab-bar component instance for bottom bar bounding rect using `#cui-bottom-bar`.
 */
export function runTabBarQuery(
  tabBarQuery: any,
  cb: (rect: BarBoundingRect | null) => void,
): void {
  if (!tabBarQuery || typeof tabBarQuery.select !== "function") {
    cb(null);
    return;
  }
  tabBarQuery.select(BOTTOM_BAR_SELECTOR).boundingClientRect();
  tabBarQuery.exec((res: any) => {
    const rect =
      res?.[0] && typeof res[0].height === "number" && res[0].height > 0
        ? res[0]
        : null;
    cb(rect);
  });
}

/**
 * Query custom bars using the single canonical ID selectors `#cui-top-bar` and `#cui-bottom-bar`.
 */
export function runBarsQuery(q: any, cb: (res: any) => void): void {
  if (!q || typeof q.select !== "function") {
    cb([]);
    return;
  }
  q.select(TOP_BAR_SELECTOR).boundingClientRect();
  q.select(BOTTOM_BAR_SELECTOR).boundingClientRect();
  q.exec(cb);
}

export interface DetectedBarsResult {
  topRect: BarBoundingRect | null;
  bottomRect: BarBoundingRect | null;
}

/**
 * Detect both top-bar and bottom-bar, supporting:
 * - Top-bar: `#cui-top-bar` within the active page or app component
 * - Bottom-bar: native `<tab-bar>` via `page.getTabBar()`, falling back to `#cui-bottom-bar` in-page
 */
export function detectBars(
  appInstance: any,
  cb: (result: DetectedBarsResult) => void,
): void {
  const pageQuery = getPageQuery();
  const tabBar = getCustomTabBarInstance();
  const tabBarQuery = getTabBarQuery(tabBar);

  let topRect: BarBoundingRect | null = null;
  let bottomRect: BarBoundingRect | null = null;
  let pageDone = false;
  let tabBarDone = !tabBarQuery;

  const tryFinish = () => {
    if (!pageDone || !tabBarDone) return;
    cb({ topRect, bottomRect });
  };

  runBarsQuery(pageQuery, (res: any) => {
    topRect = res?.[0] ?? null;
    const pageBottom = res?.[1] ?? null;

    if (
      (!topRect || !pageBottom) &&
      appInstance &&
      typeof appInstance.createSelectorQuery === "function"
    ) {
      try {
        runBarsQuery(appInstance.createSelectorQuery(), (innerRes: any) => {
          if (!topRect && innerRes?.[0]) {
            topRect = innerRes[0];
          }
          if (!bottomRect) {
            bottomRect = pageBottom || innerRes?.[1] || null;
          }
          pageDone = true;
          tryFinish();
        });
        return;
      } catch {}
    }

    if (!bottomRect) {
      bottomRect = pageBottom;
    }
    pageDone = true;
    tryFinish();
  });

  if (tabBarQuery) {
    runTabBarQuery(tabBarQuery, (tabRect: any) => {
      if (tabRect && typeof tabRect.height === "number" && tabRect.height > 0) {
        bottomRect = tabRect;
      }
      tabBarDone = true;
      tryFinish();
    });
  }
}
