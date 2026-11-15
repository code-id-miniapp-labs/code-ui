import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  appMetricsSignal,
  createAppHostBehavior,
  cuiAppParentBehavior,
  setupAppRelations,
} from "@code-ui/miniapp/behaviors/app";
import type { AppMetrics } from "@code-ui/miniapp/behaviors/app";
import { createToastHostBehavior } from "@code-ui/miniapp/behaviors/toast";
import type { ToastEntry } from "@code-ui/miniapp/behaviors/toast";
import { resolveSlots } from "../../utils/ui";
import themeConfig from "virtual:cui/theme/app";
import { tv } from "../../utils/variants";
import {
  buildRootCssVars,
  detectBars,
  extractBottomBarHeight,
  extractTopBarHeight,
  resolveAppLayout,
} from "./utils";

const appTheme = tv(themeConfig);

const appHostBehavior = createAppHostBehavior({
  detectBars,
  extractTopBarHeight,
  extractBottomBarHeight,
});
const toastHostBehavior = createToastHostBehavior();

const relations: Record<string, any> = {};
setupAppRelations(relations, "parent");

Component(
  createComponentOptions({
    behaviors: [
      cuiAppParentBehavior,
      appHostBehavior,
      toastHostBehavior,
      computedBehavior,
    ],
    relations,
    slots: {
      default: false,
    },

    properties: {
      safeArea: {
        type: String,
        value: "none",
      },
      scaleBackground: {
        type: String,
        value: "bg-black",
      },
      scaleFactor: {
        type: Number,
        value: 0.94,
      },
      ui: {
        type: Object,
        value: {},
      },
      className: {
        type: String,
        value: "",
      },
      maxToasts: {
        type: Number,
        value: 2,
      },
      topBarHeight: {
        type: Number,
        value: 0,
      },
      bottomBarHeight: {
        type: Number,
        value: 0,
      },
      autoDetectBars: {
        type: Boolean,
        value: true,
      },
    },

    data: {
      toasts: [] as ToastEntry[],
      scaled: false,
      hostScaleFactor: 0.94,
      hostScaleBackground: "",
      topInset: 0,
      bottomInset: 0,
      detectedTopBarHeight: 0,
      detectedBottomBarHeight: 0,
      gestureScaleStyle: "",
    },

    computed: {
      classes() {
        const scaled = this.data.scaled;
        const themeFns = appTheme({ scaled });
        const resolved = resolveSlots(
          themeFns,
          this.data.ui,
          this.data.className,
        );
        if (scaled) {
          const bg =
            this.data.hostScaleBackground || this.data.scaleBackground;
          if (!bg.startsWith("#") && !bg.startsWith("rgb")) {
            resolved.root = `${resolved.root} ${bg}`.trim();
          }
        }
        return resolved;
      },

      scaleWrapperStyle() {
        if (this.data.gestureScaleStyle) {
          return this.data.gestureScaleStyle;
        }
        if (!this.data.scaled) {
          return "";
        }
        const factor = this.data.hostScaleFactor || this.data.scaleFactor;
        return `transform: scale(${factor}) translateY(var(--cui-top-offset));`;
      },

      rootStyle() {
        const m: AppMetrics = appMetricsSignal();
        const topInset = this.data.topInset;
        const bottomInset = this.data.bottomInset;

        const layout = resolveAppLayout({
          safeArea: this.data.safeArea,
          metrics: m,
          topBarHeight: this.data.topBarHeight,
          bottomBarHeight: this.data.bottomBarHeight,
          detectedTopBarHeight: this.data.detectedTopBarHeight,
          detectedBottomBarHeight: this.data.detectedBottomBarHeight,
          topInset,
          bottomInset,
        });

        const bg =
          this.data.hostScaleBackground || this.data.scaleBackground;
        const bgStyle =
          this.data.scaled && (bg.startsWith("#") || bg.startsWith("rgb"))
            ? `background-color:${bg};`
            : "";

        return buildRootCssVars(layout, m, topInset, bottomInset, bgStyle);
      },
    },
  }),
);
