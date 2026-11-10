import { computedBehavior, createComponentOptions } from "../_shared/base";
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
  syncProps: [
    "id",
    "open",
    "loading",
    "loadingIcon",
    "closeIcon",
    "actions",
    "placement",
    "mode",
    "autoInset",
  ],
  plugins: [withAppBannerInset()],
});

const relations: Record<string, WechatMiniprogram.Component.RelationOption> = {};
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

    properties: createProperties(defaultBannerProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      resolvedIcon() {
        const icon = this.data.icon;
        if (icon) return icon;
        const color = this.data.color;
        if (color === "info") return this.data.infoIcon || "info";
        if (color === "success") return this.data.successIcon || "check";
        if (color === "warning") return this.data.warningIcon || "alert";
        if (color === "error" || color === "danger") return this.data.errorIcon || "close";
        return "";
      },

      classes() {
        const rawColor = this.data.color || "primary";
        const color = rawColor === "error" ? "danger" : rawColor;
        const variant = this.data.variant || "soft";
        const placement = this.data.placement || "top";
        const mode =
          this.data.mode || (placement === "inline" ? "inline" : "fixed");

        const themeFns = bannerTheme({
          color,
          variant,
          placement,
          mode,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },

      rootStyle() {
        const placement = this.data.placement || "top";
        const mode =
          this.data.mode || (placement === "inline" ? "inline" : "fixed");

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

      handleActionTap(this: any, event: any) {
        const index = Number(event.currentTarget.dataset.index);
        getApi(this, "banner")?.handleAction(index);
      },
    },
  }),
);

