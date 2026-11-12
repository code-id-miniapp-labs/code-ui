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

    properties: createProperties(defaultBannerProps, {
      className: {
        type: String,
        value: "",
      },
      badge: {
        type: null,
        value: null,
      },
      badgeProps: {
        type: Object,
        value: null,
      },
    }),

    computed: {
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

      handleActionTap(this: any, event: any) {
        const raw =
          event?.currentTarget?.dataset?.index ?? event?.target?.dataset?.index;
        const index = raw !== undefined && raw !== null ? Number(raw) : NaN;
        if (!Number.isNaN(index)) {
          getApi(this, "banner")?.handleAction(index);
        }
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
