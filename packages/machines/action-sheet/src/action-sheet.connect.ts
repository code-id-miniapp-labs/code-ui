import type { ActionSheetApi, ActionSheetService } from "./action-sheet.types";
import * as dom from "./action-sheet.dom";

export function connectActionSheet(
  service: ActionSheetService,
): ActionSheetApi {
  const { state, send, computed, scope, context } = service;

  const open = computed("isOpen");
  const visible = computed("isVisible");
  const currentState = state.get();
  const loadingActionIndex = context.get("loadingActionIndex");

  return {
    open,
    visible,
    state: currentState,
    loadingActionIndex,

    setOpen(nextOpen: boolean) {
      send({ type: nextOpen ? "OPEN" : "CLOSE" });
    },

    openActionSheet() {
      send({ type: "OPEN" });
    },

    closeActionSheet() {
      send({ type: "CLOSE" });
    },

    select(index: number) {
      send({ type: "SELECT", index });
    },

    handleAction(index: number) {
      send({ type: "ACTION", index });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      hidden: !visible,
    },

    backdropProps: {
      id: dom.getBackdropId(scope),
      "data-state": open ? "open" : "closed",
      "aria-hidden": true,
      hidden: !visible,
    },

    contentProps: {
      id: dom.getContentId(scope),
      "data-state": currentState,
      "aria-role": "dialog",
      "aria-modal": true,
      "aria-hidden": !open,
      hidden: !visible,
    },

    closeTriggerProps: {
      id: dom.getCloseTriggerId(scope),
      "aria-role": "button",
      "aria-label": "Close",
    },

    actionsProps: {
      id: dom.getActionsId(scope),
    },
  };
}
