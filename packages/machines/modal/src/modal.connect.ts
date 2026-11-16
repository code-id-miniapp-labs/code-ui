import type { ModalApi, ModalService } from "./modal.types";
import * as dom from "./modal.dom";

export function connectModal(service: ModalService): ModalApi {
  const { state, send, computed, context, scope } = service;

  const open = computed("isOpen");
  const visible = computed("isVisible");
  const currentState = state.get();
  const keyboardHeight = context.get("keyboardHeight");

  return {
    open,
    visible,
    state: currentState,

    setOpen(nextOpen: boolean) {
      send({ type: nextOpen ? "OPEN" : "CLOSE" });
    },

    openModal() {
      send({ type: "OPEN" });
    },

    closeModal() {
      send({ type: "CLOSE" });
    },

    toggle() {
      send({ type: "TOGGLE" });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      hidden: !visible,
    },

    overlayProps: {
      id: dom.getOverlayId(scope),
      "data-state": open ? "open" : "closed",
      "aria-hidden": true,
      hidden: !visible,
    },

    containerProps: {
      id: dom.getContainerId(scope),
      style: keyboardHeight > 0 ? `padding-bottom: ${keyboardHeight}px;` : "",
    },

    contentProps: {
      id: dom.getContentId(scope),
      "data-state": currentState,
      "data-keyboard-height": keyboardHeight,
      "aria-role": "dialog",
      "aria-modal": true,
      "aria-hidden": !open,
      hidden: !visible,
      style:
        keyboardHeight > 0 ? `--keyboard-height: ${keyboardHeight}px;` : "",
    },

    closeTriggerProps: {
      id: dom.getCloseTriggerId(scope),
      "aria-label": "Close",
    },
  };
}
