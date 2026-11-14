import type {
  NormalizeProps,
  PropTypes,
} from "@code-ui/core";
import type { ToastApi, ToastService } from "./toast.types";
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
  const rawActions = prop("actions");

  const actions = rawActions.map((action, index) => ({
    label: action.label,
    index,
    color: action.color ?? "neutral",
    variant: action.variant ?? "outline",
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
      send({ type: "TRIGGER_ACTION", index });
    },

    rootProps: normalize ? normalize.element(rootAttrs) : rootAttrs,
  };
}
