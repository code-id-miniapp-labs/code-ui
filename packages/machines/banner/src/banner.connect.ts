import type { NormalizeProps, PropTypes } from "@code-id-labs/core";
import type { BannerApi, BannerService } from "./banner.types";
import * as dom from "./banner.dom";

export function connectBanner<T extends PropTypes = PropTypes>(
  service: BannerService,
  _normalize?: NormalizeProps<T>,
): BannerApi {
  const { state, computed, send, scope } = service;

  const isOpen = computed("isOpen");
  const isVisible = computed("isVisible");
  const isDismissing = computed("isDismissing");
  const currentState = state.get();

  return {
    state: currentState,
    open: isOpen,
    visible: isVisible,
    dismissing: isDismissing,

    dismiss() {
      send({ type: "DISMISS" });
    },

    handleAction(index: number) {
      send({ type: "TRIGGER_ACTION", index });
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
