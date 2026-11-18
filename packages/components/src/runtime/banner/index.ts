import { computedBehavior, createComponentOptions } from "../_shared/base";
import type { MiniAppBaseEventLike } from "@code-ui/utils";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import {
  cuiAppChildBehavior,
  setupAppRelations,
  withAppBannerInset,
} from "@code-ui/miniapp/behaviors/app";
import { resolveSlots } from "../../utils/ui";
import {
  resolveSubcomponentList,
  resolveSubcomponentProps,
  resolveTriggerButtonProps,
} from "../../utils/subcomponent";
import {
  type BannerAction,
  type BannerBadgeProps,
  type BannerButtonProps,
  bannerMachine,
  connectBanner,
  defaultBannerProps,
} from "@code-ui/banner";
import themeConfig from "virtual:cui/theme/banner";
import { tv } from "../../utils/variants";

const bannerTheme = tv(themeConfig);

const bannerBehavior = createMachineBehavior({
  machine: bannerMachine,
  connect: connectBanner,
  key: "banner",
  exportApi: true,
  exportApiKeys: ["open", "visible", "dismiss", "handleAction"],
  plugins: [withAppBannerInset()],
});

const relations: Record<string, WechatMiniprogram.Component.RelationOption> =
  {};
setupAppRelations(relations, "child");

function px(value: number | string): string {
  if (typeof value === "string") {
    return value.endsWith("px") || value.endsWith("rpx") || value.endsWith("%")
      ? value
      : `${value}px`;
  }
  return `${Math.round(value * 100) / 100}px`;
}

Component(
  createComponentOptions({
    behaviors: [cuiAppChildBehavior, bannerBehavior, computedBehavior],
    relations,
    slots: {
      default: false,
      leading: false,
      badge: false,
      caption: false,
      title: false,
      description: false,
      image: false,
      close: false,
      more: false,
      buttonArea: false,
      actions: false,
    },

    properties: createProperties(defaultBannerProps, {
      className: {
        type: String,
        value: "",
      },
      color: {
        type: String,
        value: "primary",
      },
      variant: {
        type: String,
        value: "solid",
      },
      size: {
        type: String,
        value: "md",
      },
      placement: {
        type: String,
        value: "top",
      },
      mode: {
        type: String,
        value: "fixed",
      },
      title: {
        type: String,
        value: "",
      },
      description: {
        type: String,
        value: "",
      },
      caption: {
        type: String,
        value: "",
      },
      badge: {
        type: null,
        value: null,
      },
      icon: {
        type: String,
        value: "",
      },
      image: {
        type: String,
        value: "",
      },
      imagePosition: {
        type: String,
        value: "left",
      },
      imageShape: {
        type: String,
        value: "rect",
      },
      imageMode: {
        type: String,
        value: "aspectFill",
      },
      close: {
        type: null,
        value: true,
      },
      more: {
        type: null,
        value: false,
      },
      hoverClass: {
        type: String,
        value: "none",
      },
      topOffset: {
        type: null,
        value: null,
      },
      bottomOffset: {
        type: null,
        value: null,
      },
      autoInset: {
        type: Boolean,
        value: true,
      },
      ui: {
        type: Object,
        value: {},
      },
    }),

    computed: {
      resolvedBadge() {
        const rawBadge = this.data.badge as
          | string
          | BannerBadgeProps
          | null
          | undefined;
        if (
          typeof rawBadge === "string" &&
          rawBadge.trim().length === 0
        ) {
          return null;
        }
        if (
          typeof rawBadge === "object" &&
          rawBadge !== null &&
          !rawBadge.label &&
          !rawBadge.color &&
          !rawBadge.variant &&
          !rawBadge.ui &&
          !rawBadge.className
        ) {
          return null;
        }

        const bannerColor = this.data.color as string | undefined;
        const bannerVariant = this.data.variant as string | undefined;
        const bannerSize = this.data.size as string | undefined;

        const resolved = resolveSubcomponentProps<BannerBadgeProps>(
          rawBadge,
          {
            color: bannerColor,
            variant: bannerVariant === "solid" ? "outline" : "solid",
            size:
              bannerSize === "xs" || bannerSize === "sm"
                ? "xs"
                : bannerSize === "xl"
                  ? "md"
                  : "sm",
          },
          "label",
        );

        if (!resolved) {
          return null;
        }

        return {
          label: resolved.label ?? "",
          color: resolved.color ?? bannerColor ?? "primary",
          variant:
            resolved.variant ??
            (bannerVariant === "solid" ? "outline" : "solid"),
          size:
            resolved.size ??
            (bannerSize === "xs" || bannerSize === "sm"
              ? "xs"
              : bannerSize === "xl"
                ? "md"
                : "sm"),
          ui: resolved.ui ?? {},
          className: resolved.className ?? "",
        };
      },

      resolvedClose() {
        const classes = this.data.classes as Record<string, string> | undefined;
        const bannerColor = this.data.color as string;
        const bannerVariant = this.data.variant as string;
        const bannerSize = this.data.size as string;

        return resolveTriggerButtonProps<BannerButtonProps>(
          this.data.close as boolean | BannerButtonProps | null | undefined,
          {
            icon: "close",
            color: bannerVariant === "solid" ? "neutral" : bannerColor,
            variant: "ghost",
            size: bannerSize === "xs" || bannerSize === "sm" ? "xs" : "sm",
            ui: { icon: classes?.closeIcon ?? "" },
          },
          classes?.close,
        );
      },

      resolvedMore() {
        const classes = this.data.classes as Record<string, string> | undefined;
        const bannerColor = this.data.color as string;
        const bannerVariant = this.data.variant as string;
        const bannerSize = this.data.size as string;

        return resolveTriggerButtonProps<BannerButtonProps>(
          this.data.more as boolean | BannerButtonProps | null | undefined,
          {
            icon: "chevronRight",
            color: bannerVariant === "solid" ? "neutral" : bannerColor,
            variant: "ghost",
            size: bannerSize === "xs" || bannerSize === "sm" ? "xs" : "sm",
            ui: { icon: classes?.moreIcon ?? "" },
          },
          classes?.more,
        );
      },

      resolvedActions() {
        const rawActions = (this.data.actions || []) as BannerAction[];
        const classes = this.data.classes as Record<string, string> | undefined;
        const bannerColor = this.data.color as string;
        const bannerVariant = this.data.variant as string;

        return resolveSubcomponentList<BannerAction>(
          rawActions,
          {
            label: "",
            variant: "ghost",
            size: "xs",
            color: bannerVariant === "solid" ? "neutral" : bannerColor,
            loadingIcon: "loading",
            ui: { icon: classes?.actionIcon ?? "" },
          },
          "label",
          (action, raw) => {
            const hasCustomColor =
              typeof raw === "object" && raw !== null && Boolean(raw.color);
            action.loading = Boolean(action.loading);
            action.disabled = Boolean(action.disabled);
            action.closeOnClick = Boolean(action.closeOnClick);
            action.ui = action.ui ?? {};
            action.className = [
              hasCustomColor ? "" : classes?.actionButton,
              action.className,
            ]
              .filter(Boolean)
              .join(" ");
            return action;
          },
        );
      },

      classes() {
        const color = this.data.color;
        const variant = this.data.variant;
        const size = this.data.size;
        const placement = this.data.placement;
        const mode = this.data.mode;
        const imagePosition = this.data.imagePosition;
        const imageShape = this.data.imageShape;

        const themeFns = bannerTheme({
          color,
          variant,
          size,
          placement,
          mode,
          imagePosition,
          imageShape,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },

      rootStyle() {
        const placement = this.data.placement;
        const mode = this.data.mode;

        if (mode === "inline" || placement === "inline") {
          return "";
        }

        if (placement === "bottom") {
          const rawBottom = this.data.bottomOffset;
          const bottomVal =
            rawBottom !== undefined && rawBottom !== null && rawBottom !== ""
              ? px(rawBottom)
              : "var(--cui-banner-bottom-offset, var(--cui-bottom-bar-height, env(safe-area-inset-bottom, 0px)))";
          return `bottom: ${bottomVal};`;
        }

        const rawTop = this.data.topOffset;
        const topVal =
          rawTop !== undefined && rawTop !== null && rawTop !== ""
            ? px(rawTop)
            : "var(--cui-banner-top-offset, var(--cui-top-bar-height, 0px))";
        return `top: ${topVal};`;
      },
    },

    methods: {
      handleCloseTap(this: any) {
        getApi(this, "banner")?.dismiss();
      },

      handleActionTap(this: any, event: MiniAppBaseEventLike<{ index: number }>) {
        const index = Number(event.currentTarget?.dataset?.index);
        getApi(this, "banner")?.handleAction(index);
      },

      handleMoreTap(this: any) {
        getApi(this, "banner")?.handleMore();
      },

      handleTap(this: any) {
        getApi(this, "banner")?.handleTap();
      },
    },
  }),
);
