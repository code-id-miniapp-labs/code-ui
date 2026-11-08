import type { DrawerApi, DrawerService } from "./drawer.types";
import * as dom from "./drawer.dom";

export function connectDrawer(service: DrawerService): DrawerApi {
  const { state, send, computed, context, prop, scope } = service;

  const open = computed("isOpen");
  const visible = computed("isVisible");
  const currentState = state.get();
  const placement = computed("placement");
  const threshold = prop("threshold") ?? 80;
  const duration = prop("duration") ?? 300;
  const shouldScaleBackground = Boolean(prop("shouldScaleBackground"));
  const scaleFactor = prop("scaleFactor") ?? 0.94;
  const scaleBackground = prop("scaleBackground") ?? "bg-black";
  const keyboardHeight = context.get("keyboardHeight");

  return {
    open,
    visible,
    state: currentState,
    placement,
    threshold,
    duration,
    shouldScaleBackground,
    scaleFactor,
    scaleBackground,

    setOpen(nextOpen: boolean) {
      if (computed("isOpen") === nextOpen) return;
      send({ type: nextOpen ? "OPEN" : "CLOSE" });
    },

    openDrawer() {
      send({ type: "OPEN" });
    },

    closeDrawer() {
      send({ type: "CLOSE" });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      "data-placement": placement,
      hidden: !visible,
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
      style: keyboardHeight > 0 ? `--keyboard-height: ${keyboardHeight}px;` : "",
    },

    grabberProps: {
      id: dom.getGrabberId(scope),
      "data-state": currentState,
      "data-placement": placement,
      "data-should-scale": shouldScaleBackground,
      "data-scale-factor": scaleFactor,
    },

    closeTriggerProps: {
      id: dom.getCloseTriggerId(scope),
      "aria-label": "Close",
    },

    headerProps: {},
    bodyProps: {},
    footerProps: {},
  };
}
