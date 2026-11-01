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
