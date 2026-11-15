import type { NormalizeProps, PropTypes } from "@code-ui/core";
import type {
  BannerApi,
  BannerBadgeProps,
  BannerService,
} from "./banner.types";
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

  const rawActions = prop("actions");
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

  const rawBadge = prop("badge");
  const rawBadgeProps = prop("badgeProps");
  const bannerColor = prop("color") as string | undefined;
  const bannerVariant = prop("variant") as string | undefined;
  const bannerSize = prop("size") as string | undefined;

  let badge: BannerBadgeProps | null = null;
  const hasStringBadge =
    typeof rawBadge === "string" && rawBadge.trim().length > 0;
  const hasObjectBadge = typeof rawBadge === "object" && rawBadge !== null;
  const hasBadgeProps =
    typeof rawBadgeProps === "object" && rawBadgeProps !== null;

  if (hasStringBadge || hasObjectBadge || hasBadgeProps) {
    const base: BannerBadgeProps =
      typeof rawBadge === "string"
        ? { label: rawBadge }
        : hasObjectBadge
          ? { ...rawBadge }
          : {};

    const merged: BannerBadgeProps = hasBadgeProps
      ? { ...base, ...rawBadgeProps }
      : base;

    const label = merged.label ?? "";
    if (
      label ||
      merged.color ||
      merged.variant ||
      merged.ui ||
      merged.className
    ) {
      badge = {
        label,
        color: merged.color ?? bannerColor,
        variant:
          merged.variant ??
          (bannerVariant === "solid" ? "outline" : "solid"),
        size:
          merged.size ??
          (bannerSize === "xs" || bannerSize === "sm"
            ? "xs"
            : bannerSize === "xl"
              ? "md"
              : "sm"),
        ui: merged.ui,
        className: merged.className,
      };
    }
  }

  return {
    state: currentState,
    open: isOpen,
    visible: isVisible,
    dismissing: isDismissing,
    badge,
    actions,

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
