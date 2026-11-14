import type {
  ActionSheetAction,
  ActionSheetApi,
  ActionSheetItem,
  ActionSheetService,
} from "./action-sheet.types";
import * as dom from "./action-sheet.dom";

export function connectActionSheet(
  service: ActionSheetService,
): ActionSheetApi {
  const { state, send, computed, prop, scope, context } = service;

  const open = computed("isOpen");
  const visible = computed("isVisible");
  const currentState = state.get();
  const rawItems = prop("items");
  const rawActions = prop("actions");
  const loadingActionIndex = context.get("loadingActionIndex");

  const items: ActionSheetItem[] = rawItems.map((item, index) => ({
    key: item.key ?? String(index),
    label: item.label,
    description: item.description,
    icon: item.icon,
    loadingIcon: item.loadingIcon || "loading",
    color: item.color,
    destructive: Boolean(item.destructive),
    disabled: Boolean(item.disabled),
    loading: Boolean(item.loading),
    openType: item.openType ?? "",
    className: item.className ?? "",
    style: item.style ?? "",
  }));

  const actions: ActionSheetAction[] = rawActions.map((action, index) => ({
    label: action.label,
    onClick: action.onClick,
    icon: action.icon,
    loading: Boolean(action.loading || loadingActionIndex === index),
    loadingAuto: action.loadingAuto !== false,
    loadingIcon: action.loadingIcon || "loading",
    color: action.color || "neutral",
    variant: action.variant || "ghost",
    size: action.size || "xl",
    closeOnClick: action.closeOnClick !== false,
    disabled: Boolean(action.disabled),
    openType: action.openType ?? "",
    className: action.className ?? "",
    ui: action.ui,
  }));

  return {
    open,
    visible,
    state: currentState,
    items,
    actions,

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
