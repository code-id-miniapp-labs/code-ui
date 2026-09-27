import type {
  DrawerApi,
  DrawerService,
} from "./drawer.types";
import { parts } from "./drawer.anatomy";
import * as dom from "./drawer.dom";

export function connectDrawer(service: DrawerService): DrawerApi {
  const { state, send, computed, scope } = service;

  const open = state.hasTag("open");
  const currentState = state.get();
  const placement = computed("placement");
  const threshold = service.prop("threshold") ?? 80;
  const duration  = service.prop("duration")  ?? 300;

  return {
    open,
    state: currentState,
    placement,
    threshold,
    duration,

    setOpen(nextOpen: boolean) {
      if (state.hasTag("open") === nextOpen) return;
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
    },

    backdropProps: {
      id: dom.getBackdropId(scope),
      ...parts.backdrop.attrs,
      "data-state": open ? "open" : "closed",
      "aria-hidden": !open,
    },

    contentProps: {
      id: dom.getContentId(scope),
      ...parts.content.attrs,
      "data-state": currentState,
      "data-placement": placement,
      role: "dialog",
      "aria-modal": "true",
      "aria-hidden": !open,
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
