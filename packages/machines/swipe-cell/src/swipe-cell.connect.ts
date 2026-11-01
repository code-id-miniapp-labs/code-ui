import type {
  SwipeActionItem,
  SwipeCellActionSnapshot,
  SwipeCellApi,
  SwipeCellService,
  SwipeSide,
} from "./swipe-cell.types";
import { parts } from "./swipe-cell.anatomy";
import * as dom from "./swipe-cell.dom";

export function connectSwipeCell(service: SwipeCellService): SwipeCellApi {
  const { state, send, computed, context, prop, scope } = service;

  const open = computed("isOpen");
  const currentState = state.get();
  const openedSide = computed("openedSide");
  const offset = computed("offset");
  const disabled = computed("isDisabled");
  const variant = prop("variant") ?? "plain";
  const size = prop("size") ?? "md";
  const duration = prop("duration") ?? 300;
  const threshold = prop("threshold") ?? 30;
  const leftWidth = context.get("leftWidth");
  const rightWidth = context.get("rightWidth");
  const hasLeftActions = computed("hasLeftActions");
  const hasRightActions = computed("hasRightActions");

  const rawLeft: SwipeActionItem[] = prop("left") ?? [];
  const rawRight: SwipeActionItem[] = prop("right") ?? [];

  const leftActions: SwipeCellActionSnapshot[] = rawLeft.map(
    (action, index) => ({
      index,
      side: "left",
      value: action.value,
      text: action.text,
      icon: action.icon,
      className: action.className,
      style: action.style,
      color: action.color,
      disabled: action.disabled,
      raw: action,
    }),
  );

  const rightActions: SwipeCellActionSnapshot[] = rawRight.map(
    (action, index) => ({
      index,
      side: "right",
      value: action.value,
      text: action.text,
      icon: action.icon,
      className: action.className,
      style: action.style,
      color: action.color,
      disabled: action.disabled,
      raw: action,
    }),
  );

  const contentStyle =
    offset !== 0 ? `transform: translate3d(${offset}px, 0, 0);` : "";

  return {
    open,
    state: currentState,
    openedSide,
    offset,
    variant,
    size,
    disabled,
    duration,
    threshold,
    leftWidth,
    rightWidth,
    hasLeftActions,
    hasRightActions,
    leftActions,
    rightActions,

    openCell(side: SwipeSide = "right") {
      send({ type: "OPEN", side });
    },

    closeCell() {
      send({ type: "CLOSE" });
    },

    toggleCell(side?: SwipeSide) {
      if (side !== undefined) {
        send({ type: "TOGGLE", side });
      } else {
        send({ type: "TOGGLE" });
      }
    },

    measure() {
      send({ type: "MEASURE" });
    },

    handleTouchStart(data?: Record<string, unknown>) {
      send({ type: "DRAG_START", data });
    },

    handleTouchMove(data?: { offset?: number; deltaX?: number }) {
      const moveOffset = typeof data?.offset === "number" ? data.offset : 0;
      send({ type: "DRAG_MOVE", offset: moveOffset });
    },

    handleTouchEnd(data?: {
      opened: boolean;
      side: SwipeSide | null;
      offset: number;
    }) {
      const opened = Boolean(data?.opened);
      const side = data?.side ?? null;
      const endOffset = typeof data?.offset === "number" ? data.offset : 0;
      send({ type: "DRAG_END", opened, side, offset: endOffset });
    },

    handleContentTap() {
      send({ type: "CONTENT_TAP" });
    },

    handleActionTap(
      ev:
        | { side: SwipeSide; index: number }
        | {
            currentTarget?: {
              dataset?: { side?: SwipeSide; index?: number | string };
            };
          }
        | any,
    ) {
      let side: SwipeSide | undefined;
      let index: number | undefined;

      if ("currentTarget" in ev && ev.currentTarget?.dataset) {
        side = ev.currentTarget.dataset.side as SwipeSide | undefined;
        index = Number(ev.currentTarget.dataset.index);
      } else if ("side" in ev && "index" in ev) {
        side = ev.side;
        index = ev.index;
      }

      if (!side || index === undefined || isNaN(index)) return;

      const list = side === "left" ? rawLeft : rawRight;
      const action = list[index];
      if (action) {
        send({ type: "ACTION_CLICK", action, side, index });
      }
    },

    rootProps: {
      id: dom.getRootId(scope),
      ...parts.root.attrs,
      "data-state": currentState,
      "data-disabled": disabled,
      "data-open": open,
      "data-side": openedSide ?? "",
    },

    wrapperProps: {
      id: dom.getWrapperId(scope),
      ...parts.wrapper.attrs,
      "data-state": currentState,
      "data-disabled": disabled,
    },

    leftProps: {
      id: dom.getLeftId(scope),
      ...parts.left.attrs,
      "data-state": currentState,
      hidden: !hasLeftActions,
    },

    contentProps: {
      id: dom.getContentId(scope),
      ...parts.content.attrs,
      "data-state": currentState,
    },

    rightProps: {
      id: dom.getRightId(scope),
      ...parts.right.attrs,
      "data-state": currentState,
      hidden: !hasRightActions,
    },

    contentStyle,
  };
}
