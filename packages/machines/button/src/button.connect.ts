import type { ButtonApi, ButtonService } from "./button.types";
import { parts } from "./button.anatomy";
import * as dom from "./button.dom";

export function connectButton(service: ButtonService): ButtonApi {
  const { state, send, context, computed, scope } = service;

  const currentState = state.get();
  const loading = computed("isLoading");
  const internalLoading = Boolean(context.get("internalLoading"));
  const disabled = computed("isDisabled");
  const variant = context.get("variant");
  const color = context.get("color");
  const size = context.get("size");
  const block = context.get("block");

  return {
    state: currentState,
    loading,
    internalLoading,
    disabled,
    variant,
    color,
    size,
    block,

    setLoading(nextLoading: boolean) {
      send({ type: "SET_LOADING", loading: nextLoading });
    },

    setDisabled(nextDisabled: boolean) {
      send({ type: "SET_DISABLED", disabled: nextDisabled });
    },

    handleTap(event?: any) {
      send({ type: "TAP", event });
    },

    rootProps: {
      id: dom.getRootId(scope),
      ...parts.root.attrs,
      "data-state": currentState,
      "data-loading": loading ? "true" : "false",
      "data-disabled": disabled ? "true" : "false",
      "data-variant": variant,
      "data-color": color,
      "data-size": size,
      "data-block": block ? "true" : "false",
      disabled: disabled || loading,
      role: "button",
      "aria-busy": loading ? "true" : "false",
      "aria-disabled": disabled ? "true" : "false",
    },

    spinnerProps: {
      id: dom.getSpinnerId(scope),
      ...parts.spinner.attrs,
      "aria-hidden": "true",
    },

    labelProps: {
      id: dom.getLabelId(scope),
      ...parts.label.attrs,
    },

    iconProps: {
      id: dom.getIconId(scope),
      ...parts.icon.attrs,
      "aria-hidden": "true",
    },
  };
}
