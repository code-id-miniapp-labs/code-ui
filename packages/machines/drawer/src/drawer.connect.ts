import type { DrawerApi, DrawerService } from "./drawer.types";
import { parts } from "./drawer.anatomy";

export function connectDrawer(service: DrawerService): DrawerApi {
  const { state, send, context, computed } = service;

  const open = state.hasTag("open");
  const currentState = state.get();
  const placement = computed("placement");
  const dragging = state.matches("swiping");
  const dragOffset = context.get("dragOffset");
  const keyboardHeight = context.get("keyboardHeight");

  const getContentTransform = () => {
    // Determine base offset from dragging and keyboard
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
      ...parts.root.attrs,
      "data-state": currentState,
      "data-placement": placement,
    },

    backdropProps: {
      ...parts.backdrop.attrs,
      "data-state": open ? "open" : "closed",
      "aria-hidden": !open,
    },

    contentProps: {
      ...parts.content.attrs,
      "data-state": currentState,
      "data-placement": placement,
      "data-dragging": dragging ? "true" : "false",
      role: "dialog",
      "aria-modal": "true",
      "aria-hidden": !open,
      style: getContentTransform(),
    },

    grabberProps: {
      ...parts.grabber.attrs,
      "data-state": currentState,
      "data-placement": placement,
    },

    closeTriggerProps: {
      ...parts.closeTrigger.attrs,
      "aria-label": "Close",
    },
  };
}
