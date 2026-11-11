import type { NormalizeProps, PropTypes } from "@code-ui/core";
import type { BannerAction, BannerApi, BannerService } from "./banner.types";
import * as dom from "./banner.dom";

export function connectBanner<T extends PropTypes = PropTypes>(
  service: BannerService,
  _normalize?: NormalizeProps<T>,
): BannerApi {
  const { state, computed, prop, send, scope } = service;

  const isOpen = computed("isOpen");
  const isVisible = computed("isVisible");
  const isDismissing = computed("isDismissing");
  const currentState = state.get();

  const rawActions = (prop("actions") as BannerAction[] | undefined) ?? [];
  const actions = rawActions.map((action, index) => ({
    label: action.label,
    index,
    icon: action.icon,
    loading: Boolean(action.loading),
    loadingIcon: action.loadingIcon ?? "loading",
    color: action.color ?? "",
    variant: action.variant ?? "ghost",
    size: action.size ?? "xs",
    closeOnClick: Boolean(action.closeOnClick),
    ui: action.ui,
  }));

  return {
    state: currentState,
    open: isOpen,
    visible: isVisible,
    dismissing: isDismissing,
    actions,

    dismiss() {
      send({ type: "DISMISS" });
    },

    handleAction(index: number) {
      const currentRawActions =
        (prop("actions") as BannerAction[] | undefined) ?? rawActions;
      const action = currentRawActions[index];
      if (!action) return;
      send({ type: "TRIGGER_ACTION", action, index });
    },

    handleMore() {
      send({ type: "MORE" });
    },

    handleTap() {
      send({ type: "TAP" });
    },

    rootProps: {
      id: dom.getRootId(scope),
    },
  };
}
