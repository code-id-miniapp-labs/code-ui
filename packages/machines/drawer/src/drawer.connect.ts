import type { DrawerApi, DrawerService } from "./drawer.types";
import { parts } from "./drawer.anatomy";
import * as dom from "./drawer.dom";

export function connectDrawer(service: DrawerService): DrawerApi {
  const { state, send, computed, context, prop, scope } = service;

  const open = computed("isOpen");
  const visible = computed("isVisible");
  const currentState = state.get();
  const placement = computed("placement");
  const threshold = prop("threshold") ?? 80;
  const duration = prop("duration") ?? 300;
  const keyboardHeight = context.get("keyboardHeight");

  return {
    open,
    visible,
    state: currentState,
    placement,
    threshold,
    duration,

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
      ...parts.root.attrs,
      "data-state": currentState,
      "data-placement": placement,
      hidden: !visible,
    },

    backdropProps: {
      id: dom.getBackdropId(scope),
      ...parts.backdrop.attrs,
      "data-state": open ? "open" : "closed",
      "data-transition-state": currentState,
      "aria-hidden": true,
      hidden: !visible,
    },

    contentProps: {
      id: dom.getContentId(scope),
      ...parts.content.attrs,
      "data-state": currentState,
      "data-placement": placement,
      "data-keyboard-height": keyboardHeight,
      role: "dialog",
      "aria-modal": "true",
      "aria-hidden": !open,
      hidden: !visible,
      style: [
        keyboardHeight > 0 ? `--keyboard-height: ${keyboardHeight}px;` : "",
      ]
        .filter(Boolean)
        .join(" "),
    },

    grabberProps: {
      id: dom.getGrabberId(scope),
      ...parts.grabber.attrs,
      "data-state": currentState,
      "data-placement": placement,
    },

    closeTriggerProps: {
      id: dom.getCloseTriggerId(scope),
      ...parts.closeTrigger.attrs,
      "aria-label": "Close",
    },

    headerProps: {
      ...parts.header.attrs,
    },

    bodyProps: {
      ...parts.body.attrs,
    },

    footerProps: {
      ...parts.footer.attrs,
    },
  };
}
