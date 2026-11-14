import type { NormalizeProps, PropTypes } from "@code-ui/core";
import type { MiniAppTouchEventLike } from "@code-ui/utils";
import type { ButtonApi, ButtonService } from "./button.types";
import * as dom from "./button.dom";

export function connectButton<T extends PropTypes = PropTypes>(
  service: ButtonService,
  normalize?: NormalizeProps<T>,
): ButtonApi {
  const { state, send, computed, scope } = service;

  const loading = computed("isLoading");
  const disabled = computed("isDisabled");
  const currentState = state.get();
  const btn = normalize ? normalize.button : (v: Record<string, any>) => v;

  return {
    state: currentState,
    loading,
    disabled,

    setLoading(nextLoading: boolean) {
      send({ type: "SET_LOADING", loading: nextLoading });
    },

    setDisabled(nextDisabled: boolean) {
      send({ type: "SET_DISABLED", disabled: nextDisabled });
    },

    handleTap(event?: MiniAppTouchEventLike) {
      send({ type: "TAP", event });
    },

    rootProps: btn({
      id: dom.getRootId(scope),
      "data-state": currentState,
      "data-disabled": String(disabled),
      "data-loading": String(loading),
      disabled: disabled || loading,
      "aria-role": "button",
      "aria-disabled": disabled,
      "aria-busy": Boolean(loading),
    }),
  };
}
