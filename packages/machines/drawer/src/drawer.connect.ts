import type { DrawerApi, DrawerService } from "./drawer.types";
import * as dom from "./drawer.dom";

export function connectDrawer(service: DrawerService): DrawerApi {
  const { state, send, computed, context, scope } = service;

  const open = computed("isOpen");
  const visible = computed("isVisible");
  const currentState = state.get();
  const placement = computed("placement");
  const keyboardHeight = context.get("keyboardHeight");

  return {
    open,
    visible,
    state: currentState,

    setOpen(nextOpen: boolean) {
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

    closeTriggerProps: {
      id: dom.getCloseTriggerId(scope),
      "aria-label": "Close",
    },
  };
}
