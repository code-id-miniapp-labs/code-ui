import type { NormalizeProps, PropTypes } from "@code-ui/core";
import type {
  BannerAction,
  BannerApi,
  BannerService,
} from "./banner.types";
import * as dom from "./banner.dom";

export function connectBanner<T extends PropTypes = PropTypes>(
  service: BannerService,
  _normalize?: NormalizeProps<T>,
): BannerApi {
  const { state, context, computed, prop, send, scope } = service;

  const isOpen = computed("isOpen");
  const isVisible = computed("isVisible");
  const isDismissing = computed("isDismissing");
  const currentState = state.get();
  const height = context.get("height");
  const isLoading = Boolean(prop("loading"));
  const loadingIcon = (prop("loadingIcon") as string | undefined) ?? "loading";
  const closeIcon = (prop("closeIcon") as string | undefined) ?? "close";

  const rawActions = (prop("actions") as BannerAction[] | undefined) ?? [];
  const actions = rawActions.map((action, index) => ({
    label: action.label,
    index,
    icon: action.icon,
    loading: action.loading,
    loadingIcon: action.loadingIcon ?? loadingIcon,
    color: action.color,
    variant: action.variant,
    size: action.size,
    actionProps: {
      "data-index": index,
      "data-scope": "banner",
      "data-part": "action",
    },
  }));

  return {
    state: currentState,
    open: isOpen,
    visible: isVisible,
    dismissing: isDismissing,
    loading: isLoading,
    loadingIcon,
    closeIcon,
    height,
    actions,

    dismiss() {
      send({ type: "DISMISS" });
    },

    handleAction(index: number) {
      const action = rawActions[index];
      if (!action) return;
      send({ type: "TRIGGER_ACTION", action, index });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      "data-open": isOpen ? "true" : "false",
      "data-loading": isLoading ? "true" : "false",
      "aria-role": "region",
      "aria-live": "polite",
      "aria-busy": isLoading,
    },

    wrapperProps: {
      "data-scope": "banner",
      "data-part": "wrapper",
    },

    titleProps: {
      "data-scope": "banner",
      "data-part": "title",
    },

    descriptionProps: {
      "data-scope": "banner",
      "data-part": "description",
    },

    iconProps: {
      "data-scope": "banner",
      "data-part": "icon",
      "aria-hidden": "true",
    },

    actionsProps: {
      "data-scope": "banner",
      "data-part": "actions",
    },

    closeTriggerProps: {
      "data-scope": "banner",
      "data-part": "close-trigger",
      "aria-role": "button",
      "aria-label": "Dismiss",
    },
  };
}
