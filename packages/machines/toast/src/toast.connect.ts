import {
  defaultNormalizer,
  type NormalizeProps,
  type PropTypes,
} from "@code-ui/core";
import type { ToastAction, ToastApi, ToastService } from "./toast.types";
import { parts } from "./toast.anatomy";
import * as dom from "./toast.dom";

export function connectToast<T extends PropTypes = PropTypes>(
  service: ToastService,
  normalize: NormalizeProps<T> = defaultNormalizer as NormalizeProps<T>,
): ToastApi {
  const { state, send, context, computed, scope } = service;

  const currentState = state.get();
  const open = computed("isOpen");
  const visible = computed("isVisible");
  const paused = computed("isPaused");
  const dismissing = computed("isDismissing");

  const mode = context.get("mode");
  const color = context.get("color");
  const variant = context.get("variant");
  const orientation = context.get("orientation");
  const placement = context.get("placement");
  const title = context.get("title");
  const description = context.get("description");
  const icon = context.get("icon");
  const progress = context.get("progress");
  const progressPosition =
    (context.get("progressPosition") as "top" | "bottom" | undefined) ?? "bottom";
  const close = context.get("close");
  const rawActions = (context.get("actions") ?? []) as ToastAction[];

  const actions = rawActions.map((action, index) => ({
    label: action.label,
    index,
    color: action.color,
    variant: action.variant,
    actionProps: {
      id: dom.getActionId(scope, index),
      ...parts.action.attrs,
      "data-index": index,
      role: "button",
    },
  }));

  return {
    state: currentState,
    open,
    visible,
    dismissing,
    paused,
    mode,
    color,
    variant,
    orientation,
    placement,
    title,
    description,
    icon,
    progress: Boolean(progress),
    progressPosition,
    close,
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

    rootProps: normalize.element({
      id: dom.getRootId(scope),
      ...parts.root.attrs,
      "data-state": currentState,
      "data-mode": mode,
      "data-color": color,
      "data-variant": variant,
      "data-orientation": orientation,
      "data-placement": placement,
      "data-open": String(open),
      "data-visible": String(visible),
      role: "status",
      "aria-live": "polite",
    }),

    wrapperProps: {
      id: dom.getWrapperId(scope),
      ...parts.wrapper.attrs,
    },

    titleProps: {
      id: dom.getTitleId(scope),
      ...parts.title.attrs,
    },

    descriptionProps: {
      id: dom.getDescriptionId(scope),
      ...parts.description.attrs,
    },

    iconProps: {
      id: dom.getIconId(scope),
      ...parts.icon.attrs,
      "aria-hidden": "true",
    },

    closeTriggerProps: {
      id: dom.getCloseTriggerId(scope),
      ...parts.closeTrigger.attrs,
      role: "button",
      "aria-label": "Close",
    },

    progressProps: {
      id: dom.getProgressId(scope),
      ...parts.progress.attrs,
      "aria-hidden": "true",
    },
  };
}

