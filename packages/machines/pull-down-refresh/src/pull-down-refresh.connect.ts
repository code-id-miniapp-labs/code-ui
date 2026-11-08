import type {
  PullDownRefreshApi,
  PullDownRefreshService,
} from "./pull-down-refresh.types";
import * as dom from "./pull-down-refresh.dom";

export function connectPullDownRefresh(
  service: PullDownRefreshService,
): PullDownRefreshApi {
  const { state, send, computed, context, prop, scope } = service;

  const currentState = state.get();
  const status = computed("status");
  const statusKey = computed("statusKey");
  const barHeight = computed("barHeight");
  const tipsHeight = computed("tipsHeight");
  const text = computed("text");
  const disabled = computed("isDisabled");
  const pulling = computed("isPulling");
  const armed = computed("isArmed");
  const refreshing = computed("isRefreshing");
  const atTop = computed("isAtTop");
  const canPull = computed("canPull");
  const threshold = prop("threshold") ?? 50;
  const maxPullDistance = prop("maxPullDistance") ?? 80;
  const duration = prop("duration") ?? 300;
  const offset = context.get("offset");

  return {
    state: currentState,
    statusKey,
    status,
    barHeight,
    tipsHeight,
    text,
    disabled,
    pulling,
    armed,
    refreshing,
    atTop,
    canPull,
    threshold,
    maxPullDistance,
    duration,

    trackStyle:
      !pulling && barHeight > 0
        ? `transform: translate3d(0, ${barHeight}px, 0);`
        : "",
    tipsStyle: `height: ${tipsHeight}px;`,

    refresh() {
      send({ type: "REFRESH" });
    },

    close() {
      send({ type: "CLOSE" });
    },

    handleScroll(event: any) {
      const scrollTop = Number(event?.detail?.scrollTop ?? 0);
      const scrollLeft = Number(event?.detail?.scrollLeft ?? 0);
      send({ type: "SCROLL", scrollTop, scrollLeft });
    },

    handleScrollToUpper() {
      send({ type: "SCROLL_TO_UPPER" });
    },

    handleScrollToLower() {
      send({ type: "SCROLL_TO_LOWER" });
    },

    handleTouchStart(_data?: Record<string, unknown>) {
      send({ type: "DRAG_START" });
    },

    handleTouchMove(data?: { offset?: number }) {
      send({ type: "DRAG_MOVE", offset: Number(data?.offset ?? 0) });
    },

    handleTouchEnd(data?: { offset?: number }) {
      send({ type: "DRAG_END", offset: Number(data?.offset ?? 0) });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      ...(disabled ? { "data-disabled": "true" } : {}),
      ...(refreshing ? { "data-refreshing": "true" } : {}),
      ...(atTop ? { "data-at-top": "true" } : {}),
    },

    headerProps: {
      id: dom.getHeaderId(scope),
    },

    trackProps: {
      id: dom.getTrackId(scope),
      "data-state": currentState,
      ...(pulling ? { "data-pulling": "true" } : {}),
      ...(armed ? { "data-armed": "true" } : {}),
      ...(offset !== undefined ? { "data-offset": offset } : {}),
    },

    tipsProps: {
      id: dom.getTipsId(scope),
      "data-state": currentState,
      "aria-role": "status",
      "aria-live": "polite",
    },

    indicatorProps: {
      "aria-hidden": true,
    },

    textProps: {},

    contentProps: {
      id: dom.getContentId(scope),
    },
  };
}
