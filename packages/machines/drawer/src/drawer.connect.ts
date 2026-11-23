import type { DrawerApi, DrawerService } from "./drawer.types";
import * as dom from "./drawer.dom";

export function connectDrawer(service: DrawerService): DrawerApi {
  const { state, send, computed, context, scope } = service;

  const open = computed("isOpen");
  const visible = computed("isVisible");
  const currentState = state.get();
  const placement = computed("placement");
  const keyboardHeight = context.get("keyboardHeight");
  const keyboardOpen = keyboardHeight > 0;

  return {
    open,
    visible,
    state: currentState,
    keyboardHeight,
    keyboardOpen,

    setOpen(nextOpen: boolean) {
      send({ type: nextOpen ? "OPEN" : "CLOSE" });
    },

    openDrawer() {
      send({ type: "OPEN" });
    },

    closeDrawer() {
      send({ type: "CLOSE" });
    },

    handleBackdropTap() {
      send({ type: "BACKDROP.TAP" });
    },

    handleCloseTriggerTap() {
      send({ type: "CLOSE_TRIGGER.TAP" });
    },

    handleDragStart(data) {
      send({ type: "DRAG_START", data });
    },

    handleDragMove(data) {
      send({ type: "DRAG_MOVE", data });
    },

    handleDragEnd(passed, data) {
      send({ type: "DRAG_END", passed, data });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      "data-placement": placement,
      "data-keyboard-open": String(keyboardOpen),
      "data-keyboard-height": keyboardHeight,
      hidden: !visible,
      style: keyboardOpen
        ? `--keyboard-height: ${keyboardHeight}px;`
        : "",
    },

    backdropProps: {
      id: dom.getBackdropId(scope),
      "data-state": open ? "open" : "closed",
      "data-transition-state": currentState,
      "aria-hidden": true,
      hidden: !visible,
    },

    contentProps: {
      id: dom.getContentId(scope),
      "data-state": currentState,
      "data-placement": placement,
      "data-keyboard-height": keyboardHeight,
      "aria-role": "dialog",
      "aria-modal": true,
      "aria-hidden": !open,
      hidden: !visible,
      style: keyboardOpen ? `--keyboard-height: ${keyboardHeight}px;` : "",
    },

    closeTriggerProps: {
      id: dom.getCloseTriggerId(scope),
      "aria-label": "Close",
    },
  };
}
