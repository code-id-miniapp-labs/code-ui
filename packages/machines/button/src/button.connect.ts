import { defaultNormalizer, type NormalizeProps, type PropTypes } from "@code-ui/core";
import type { ButtonApi, ButtonService } from "./button.types";
import { parts } from "./button.anatomy";
import * as dom from "./button.dom";

export function connectButton<T extends PropTypes = PropTypes>(
  service: ButtonService,
  normalize: NormalizeProps<T> = defaultNormalizer as NormalizeProps<T>,
): ButtonApi {
  const { state, send, context, computed, scope } = service;

  const loading = computed("isLoading");
  const disabled = computed("isDisabled");
  const currentState = state.get();
  const internalLoading = Boolean(context.get("internalLoading"));
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
      if (disabled || loading) return;
      send({ type: "TAP", event });
    },

    rootProps: normalize.button({
      id: dom.getRootId(scope),
      ...parts.root.attrs,
      "data-state": currentState,
      "data-loading": String(loading),
      "data-disabled": String(disabled),
      "data-variant": variant,
      "data-color": color,
      "data-size": size,
      "data-block": String(block),
      disabled: disabled || loading,
      role: "button",
      "aria-busy": String(loading),
      "aria-disabled": String(disabled),
    }),

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
