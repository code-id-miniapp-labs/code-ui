import type {
  NormalizeProps,
  PropTypes,
} from "@code-ui/core";
import type { ToastAction, ToastApi, ToastService } from "./toast.types";
import * as dom from "./toast.dom";

export function connectToast<T extends PropTypes = PropTypes>(
  service: ToastService,
  normalize?: NormalizeProps<T>,
): ToastApi {
  const { state, send, computed, scope, prop } = service;

  const currentState = state.get();
  const open = computed("isOpen");
  const visible = computed("isVisible");
  const paused = computed("isPaused");
  const dismissing = computed("isDismissing");
  const rawActions = (prop("actions") ?? []) as ToastAction[];

  const actions = rawActions.map((action, index) => ({
    label: action.label,
    index,
    color: action.color,
    variant: action.variant,
    actionProps: {
      id: dom.getActionId(scope, index),
      "data-index": index,
      "aria-role": "button",
    },
  }));

  const rootAttrs = {
    id: dom.getRootId(scope),
    "data-state": currentState,
    "aria-role": "status",
    "aria-live": "polite",
  };

  return {
    state: currentState,
    open,
    visible,
    dismissing,
    paused,
    actions,

    dismiss() {
      send({ type: "DISMISS" });
    },

    pause() {
      send({ type: "PAUSE" });
    },

    resume() {
      send({ type: "RESUME" });
    },

    handleAction(index: number) {
      const action = rawActions[index];
      if (action) {
        send({ type: "TRIGGER_ACTION", action, index });
      }
    },

    rootProps: normalize ? normalize.element(rootAttrs) : rootAttrs,

    wrapperProps: {
      id: dom.getWrapperId(scope),
    },

    titleProps: {
      id: dom.getTitleId(scope),
    },

    descriptionProps: {
      id: dom.getDescriptionId(scope),
    },

    iconProps: {
      id: dom.getIconId(scope),
      "aria-hidden": true,
    },

    closeTriggerProps: {
      id: dom.getCloseTriggerId(scope),
      "aria-role": "button",
      "aria-label": "Close",
    },

    progressProps: {
      id: dom.getProgressId(scope),
      "aria-hidden": true,
    },
  };
}
