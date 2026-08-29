import type {
  DrawerAnatomyPart,
  DrawerApi,
  DrawerService,
} from "./drawer.types";
import { anatomy, parts } from "./drawer.anatomy";
import * as dom from "./drawer.dom";
import { getComponentConfig, mergeUI } from "@code-ui/core";

export function connectDrawer(service: DrawerService): DrawerApi {
  const { state, send, context, computed, scope } = service;

  const open = state.hasTag("open");
  const currentState = state.get();
  const placement = computed("placement");
  const threshold = service.prop("threshold") ?? 80;
  const duration  = service.prop("duration")  ?? 300;
  const instanceUI = context.get("ui");

  const globalConfig = getComponentConfig<DrawerAnatomyPart>("drawer");

  const resolvedUI = mergeUI({
    anatomy,
    globalConfig,
    extraVariants: {
      placement,
    },
    instanceUI,
  });

  return {
    open,
    state: currentState,
    placement,
    threshold,
    duration,
    ui: resolvedUI,

    setOpen(nextOpen: boolean) {
      if (open === nextOpen) return;
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
      className: resolvedUI.root,
    },

    backdropProps: {
      id: dom.getBackdropId(scope),
      ...parts.backdrop.attrs,
      "data-state": open ? "open" : "closed",
      "aria-hidden": !open,
      className: resolvedUI.backdrop,
    },

    contentProps: {
      id: dom.getContentId(scope),
      ...parts.content.attrs,
      "data-state": currentState,
      "data-placement": placement,
      role: "dialog",
      "aria-modal": "true",
      "aria-hidden": !open,
      className: resolvedUI.content,
    },

    grabberProps: {
      id: dom.getGrabberId(scope),
      ...parts.grabber.attrs,
      "data-state": currentState,
      "data-placement": placement,
      className: resolvedUI.grabber,
    },

    closeTriggerProps: {
      id: dom.getCloseTriggerId(scope),
      ...parts.closeTrigger.attrs,
      "aria-label": "Close",
      className: resolvedUI.closeTrigger,
    },

    headerProps: {
      ...parts.header.attrs,
      className: resolvedUI.header,
    },

    bodyProps: {
      ...parts.body.attrs,
      className: resolvedUI.body,
    },

    footerProps: {
      ...parts.footer.attrs,
      className: resolvedUI.footer,
    },
  };
}
