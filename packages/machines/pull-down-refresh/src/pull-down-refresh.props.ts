import type { PullDownRefreshProps } from "./pull-down-refresh.types";

export const DEFAULT_LOADING_TEXTS = [
  "Pull to refresh",
  "Release to refresh",
  "Refreshing...",
  "Refresh complete",
];

export const defaultPullDownRefreshProps: PullDownRefreshProps = {
  disabled: false,
  value: null,
  defaultValue: false,
  threshold: 50,
  maxPullDistance: 80,
  refreshTimeout: 3000,
  successDuration: 500,
  loadingTexts: [],
  duration: 300,
  showScrollbar: true,
  enableBackToTop: true,
  scrollIntoView: "",
  upperThreshold: 50,
  lowerThreshold: 50,
  scrollWithAnimation: false,
  loadingIcon: "loading",
  ui: {},
};
