import type {
  ActionSheetApi,
  ActionSheetItem,
  ActionSheetService,
} from "./action-sheet.types";
import * as dom from "./action-sheet.dom";

export function connectActionSheet(
  service: ActionSheetService,
): ActionSheetApi {
  const { state, send, computed, prop, scope } = service;

  const open = computed("isOpen");
  const visible = computed("isVisible");
  const currentState = state.get();
  const duration = prop("duration");
  const rawActions = prop("actions");
  const cancelText = prop("cancelText");
  const explicitShowCancel = prop("showCancel");
  const showCancel =
    explicitShowCancel !== undefined
      ? Boolean(explicitShowCancel)
      : Boolean(cancelText && cancelText.length > 0);

  const loadingIcon = prop("loadingIcon");
  const cancelIcon = prop("cancelIcon");
  const closeIcon = prop("closeIcon");
  const showClose = Boolean(prop("close"));

  const actions: ActionSheetItem[] = rawActions.map((item, index) => ({
    key: item.key ?? String(index),
    label: item.label,
    description: item.description,
    icon: item.icon,
    loadingIcon: item.loadingIcon || loadingIcon,
    color: item.color,
    destructive: Boolean(item.destructive),
    disabled: Boolean(item.disabled),
    loading: Boolean(item.loading),
    openType: item.openType,
    className: item.className,
    style: item.style,
  }));

  return {
    open,
    visible,
    state: currentState,
    duration,
    actions,
    showCancel,
    loadingIcon,
    cancelIcon,
    closeIcon,
    showClose,

    setOpen(nextOpen: boolean) {
      if (computed("isOpen") === nextOpen) return;
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

    cancel() {
      send({ type: "CANCEL.TAP" });
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

    headerProps: {
      id: dom.getHeaderId(scope),
    },

    closeTriggerProps: {
      id: dom.getCloseTriggerId(scope),
      "aria-role": "button",
      "aria-label": "Close",
    },

    bodyProps: {
      id: dom.getBodyId(scope),
    },

    cancelProps: {
      id: dom.getCancelId(scope),
      "aria-role": "button",
      "aria-label": cancelText,
    },
  };
}
