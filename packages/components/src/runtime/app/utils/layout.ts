import type { AppMetrics } from "@code-ui/miniapp/behaviors/app";

export interface AppLayoutInput {
  safeArea?: string | undefined;
  metrics: AppMetrics;
  topBarHeight?: number | undefined;
  bottomBarHeight?: number | undefined;
  detectedTopBarHeight?: number | undefined;
  detectedBottomBarHeight?: number | undefined;
  topInset?: number | undefined;
  bottomInset?: number | undefined;
}

export interface AppLayoutResult {
  effectiveTopBarHeight: number;
  effectiveBottomBarHeight: number;
  bannerTopOffset: number;
  bannerBottomOffset: string;
  topOffset: number;
  bottomOffset: string;
  toastTopOffset: number;
  toastBottomOffset: string;
}

export function px(value: number): string {
  return `${Math.round(value * 100) / 100}px`;
}

export function hasEdge(
  safeArea: string | undefined,
  edge: "top" | "bottom",
): boolean {
  if (!safeArea) return false;
  return safeArea === "both" || safeArea === edge;
}

/**
 * Resolve layout offsets for <c-app>, banners, toasts, and page content.
 *
 * Rules:
 * 1. Banner top offset: sits immediately below the custom top-bar if present,
 *    otherwise at safe-top (if safeArea="top" | "both"), otherwise 0.
 * 2. Page top offset (padding-top): always equals `bannerTopOffset + topInset`.
 *    Ensures zero calculation mismatch between custom app bar, banners, and page content.
 * 3. Banner bottom offset: sits immediately above custom bottom-bar if present,
 *    otherwise at safe-bottom (if safeArea="bottom" | "both"), otherwise safe-area-inset-bottom fallback.
 * 4. Page bottom offset (padding-bottom): clears custom bottom-bar or safe-bottom,
 *    plus active bottom insets (banners).
 */
export function resolveAppLayout(input: AppLayoutInput): AppLayoutResult {
  const m = input.metrics;
  const safeArea = input.safeArea || "none";
  const topInset = Math.max(0, Number(input.topInset) || 0);
  const bottomInset = Math.max(0, Number(input.bottomInset) || 0);

  const effectiveTopBarHeight =
    Number(input.topBarHeight || 0) > 0
      ? Number(input.topBarHeight)
      : Math.max(0, Number(input.detectedTopBarHeight || 0));

  const effectiveBottomBarHeight =
    Number(input.bottomBarHeight || 0) > 0
      ? Number(input.bottomBarHeight)
      : Math.max(0, Number(input.detectedBottomBarHeight || 0));

  const safeTopOffset = hasEdge(safeArea, "top") ? Math.max(0, m.safeTop) : 0;
  const safeBottomOffset = hasEdge(safeArea, "bottom")
    ? Math.max(0, m.safeBottom)
    : 0;

  // Banner top offset: immediately below custom top-bar if present, otherwise safe-top, otherwise 0
  const bannerTopOffset =
    effectiveTopBarHeight > 0 ? effectiveTopBarHeight : safeTopOffset;

  // Page content top padding: clears the banner placement baseline plus any active top insets
  const topOffset = bannerTopOffset + topInset;

  // Banner bottom offset: sits directly above custom bottom-bar or safe bottom edge
  const bannerBottomOffset =
    effectiveBottomBarHeight > 0
      ? px(effectiveBottomBarHeight)
      : safeBottomOffset > 0
        ? px(safeBottomOffset)
        : "env(safe-area-inset-bottom, 0px)";

  // Page content bottom padding: clears bottom-bar or safe-bottom, plus any active bottom insets
  let bottomOffset: string;
  if (effectiveBottomBarHeight > 0) {
    bottomOffset = px(effectiveBottomBarHeight + bottomInset);
  } else if (safeBottomOffset > 0) {
    bottomOffset = px(safeBottomOffset + bottomInset);
  } else if (bottomInset > 0) {
    bottomOffset = `calc(env(safe-area-inset-bottom, 0px) + ${px(bottomInset)})`;
  } else if (hasEdge(safeArea, "bottom")) {
    bottomOffset = "env(safe-area-inset-bottom, 0px)";
  } else {
    bottomOffset = "0px";
  }

  const toastTopOffset = topOffset;
  const toastBottomOffset = bottomOffset;

  return {
    effectiveTopBarHeight,
    effectiveBottomBarHeight,
    bannerTopOffset,
    bannerBottomOffset,
    topOffset,
    bottomOffset,
    toastTopOffset,
    toastBottomOffset,
  };
}

/**
 * Generate CSS variables string for <c-app> root style.
 */
export function buildRootCssVars(
  layout: AppLayoutResult,
  metrics: AppMetrics,
  topInset: number,
  bottomInset: number,
  bgStyle = "",
): string {
  return (
    `--cui-status-bar-height:${px(metrics.statusBarHeight)};` +
    `--cui-safe-top:${px(metrics.safeTop)};` +
    `--cui-safe-bottom:${px(metrics.safeBottom)};` +
    `--cui-menu-top:${px(metrics.menuTop)};` +
    `--cui-menu-height:${px(metrics.menuHeight)};` +
    `--cui-menu-inset:${px(metrics.menuInset)};` +
    `--cui-nav-bar-height:${px(metrics.navBarHeight)};` +
    `--cui-nav-height:${px(metrics.navHeight)};` +
    `--cui-top-bar-height:${px(layout.effectiveTopBarHeight)};` +
    `--cui-bottom-bar-height:${px(layout.effectiveBottomBarHeight)};` +
    `--cui-top-inset:${px(topInset)};` +
    `--cui-bottom-inset:${px(bottomInset)};` +
    `--cui-top-offset:${px(layout.topOffset)};` +
    `--cui-bottom-offset:${layout.bottomOffset};` +
    `--cui-banner-top-offset:${px(layout.bannerTopOffset)};` +
    `--cui-banner-bottom-offset:${layout.bannerBottomOffset};` +
    `--cui-toast-top-offset:${px(layout.toastTopOffset)};` +
    `--cui-toast-bottom-offset:${layout.toastBottomOffset};` +
    `padding-top:var(--cui-top-offset);` +
    `padding-bottom:var(--cui-bottom-offset);` +
    bgStyle
  );
}

