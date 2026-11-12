import type {
  ActionSheetAction,
  ActionSheetApi,
  ActionSheetItem,
  ActionSheetService,
} from "./action-sheet.types";
import { isPromise } from "@code-ui/utils";
import * as dom from "./action-sheet.dom";

export function connectActionSheet(
  service: ActionSheetService,
): ActionSheetApi {
  const { state, send, computed, prop, scope, context } = service;

  const open = computed("isOpen");
  const visible = computed("isVisible");
  const currentState = state.get();
  const duration = prop("duration");
  const rawItems = (prop("items") as ActionSheetItem[] | undefined) ?? [];
  const rawActions = (prop("actions") as ActionSheetAction[] | undefined) ?? [];
  const closeIcon = prop("closeIcon");
  const showClose = Boolean(prop("close"));
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
    openType: item.openType,
    className: item.className,
    style: item.style,
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
    openType: action.openType,
    className: action.className,
    ui: action.ui,
  }));

  return {
    open,
    visible,
    state: currentState,
    duration,
    items,
    actions,
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

    handleAction(index: number) {
      const action = actions[index];
      if (!action || action.disabled || action.loading) return;
      const result =
        action.onClick?.() ?? prop("onAction")?.({ action, index });
      send({ type: "ACTION", action, index, handled: true });
      if (isPromise(result) && action.loadingAuto !== false) {
        send({ type: "ACTION_LOADING", index });
        Promise.resolve(result).finally(() => {
          send({ type: "ACTION_SETTLED", index });
        });
      }
      return result;
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

    actionsProps: {
      id: dom.getActionsId(scope),
    },
  };
}
