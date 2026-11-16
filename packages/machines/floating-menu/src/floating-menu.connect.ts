import * as dom from "./floating-menu.dom";
import type { FloatingMenuApi, FloatingMenuService } from "./floating-menu.types";

export function connectFloatingMenu(
  service: FloatingMenuService,
): FloatingMenuApi {
  const { state, send, computed, scope } = service;

  const currentState = state.get();
  const open = computed("isOpen");
  const visible = computed("isVisible");
  const position = computed("position");

  const backdropId = dom.getBackdropId(scope);
  const positionerId = dom.getPositionerId(scope);

  return {
    state: currentState,
    open,
    visible,
    positioned: position.positioned,
    resolvedSide: position.resolvedSide,
    resolvedAlign: position.resolvedAlign,
    maxHeight: position.maxHeight,
    positionerStyle: position.positionerStyle,
    contentStyle: position.contentStyle,
    arrowStyle: position.arrowStyle,

    setOpen(nextOpen: boolean) {
      send({ type: nextOpen ? "OPEN" : "CLOSE" });
    },

    openMenu() {
      send({ type: "OPEN" });
    },

    closeMenu() {
      send({ type: "CLOSE" });
    },

    toggle() {
      send({ type: "TOGGLE" });
    },

    reposition() {
      send({ type: "REPOSITION" });
    },

    handleTriggerTap() {
      send({ type: "TRIGGER.TAP" });
    },

    handleBackdropTap() {
      send({ type: "BACKDROP.TAP" });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
    },

    triggerProps: {
      id: dom.getTriggerId(scope),
      "data-state": currentState,
    },

    backdropProps: {
      ...(backdropId ? { id: backdropId } : {}),
      "data-state": open ? "open" : "closed",
      "aria-hidden": true,
    },

    positionerProps: {
      ...(positionerId ? { id: positionerId } : {}),
      "data-state": currentState,
      "data-side": position.resolvedSide,
      "data-align": position.resolvedAlign,
    },

    contentProps: {
      id: dom.getContentId(scope),
      "data-state": currentState,
      "data-side": position.resolvedSide,
      "data-align": position.resolvedAlign,
      "aria-hidden": !open,
    },
  };
}
