import type {
  NormalizeProps,
  PropTypes,
} from "@code-ui/core";
import type { ButtonApi, ButtonService } from "./button.types";
import * as dom from "./button.dom";

export function connectButton<T extends PropTypes = PropTypes>(
  service: ButtonService,
  normalize?: NormalizeProps<T>,
): ButtonApi {
  const { state, send, context, computed, prop, scope } = service;

  const loading = computed("isLoading");
  const disabled = computed("isDisabled");
  const currentState = state.get();
  const internalLoading = Boolean(context.get("internalLoading"));
  const variant = prop("variant") ?? "solid";
  const color = prop("color") ?? "primary";
  const size = prop("size") ?? "md";
  const block = Boolean(prop("block"));
  const spinnerId = dom.getSpinnerId(scope);
  const labelId = dom.getLabelId(scope);
  const iconId = dom.getIconId(scope);
  const btn = normalize ? normalize.button : (v: Record<string, any>) => v;

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

    rootProps: btn({
      id: dom.getRootId(scope),
      "data-state": currentState,
      "data-disabled": String(disabled),
      "data-loading": String(loading),
      "data-variant": variant,
      "data-color": color,
      "data-size": size,
      "data-block": String(block),
      disabled: disabled || loading,
      "aria-role": "button",
      "aria-disabled": disabled,
      "aria-busy": Boolean(loading),
    }),

    spinnerProps: {
      ...(spinnerId ? { id: spinnerId } : {}),
      "aria-hidden": "true",
    },

    labelProps: labelId ? { id: labelId } : {},

    iconProps: {
      ...(iconId ? { id: iconId } : {}),
      "aria-hidden": "true",
    },
  };
}
