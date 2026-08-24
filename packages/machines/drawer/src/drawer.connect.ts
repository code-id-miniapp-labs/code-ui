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
  const dragging = state.matches("swiping");
  const dragOffset = context.get("dragOffset");
  const keyboardHeight = context.get("keyboardHeight");
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

  const getContentTransform = () => {
    const activeOffset = dragging ? dragOffset : 0;

    if (activeOffset === 0 && keyboardHeight === 0) return "";

    switch (placement) {
      case "bottom":
        // Move down by dragOffset, move up by keyboardHeight
        return `transform: translate3d(0, calc(${activeOffset}px - ${keyboardHeight}px), 0);`;
      case "top":
        return `transform: translate3d(0, -${activeOffset}px, 0);`;
      case "right":
        return `transform: translate3d(${activeOffset}px, 0, 0);`;
      case "left":
        return `transform: translate3d(-${activeOffset}px, 0, 0);`;
      default:
        return "";
    }
  };

  return {
    open,
    state: currentState,
    placement,
    dragging,
    dragOffset,
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
      "data-dragging": dragging ? "true" : "false",
      role: "dialog",
      "aria-modal": "true",
      "aria-hidden": !open,
      style: getContentTransform(),
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
