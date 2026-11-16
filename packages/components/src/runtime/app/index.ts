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
import { createAppThemeBehavior } from "@code-ui/miniapp/behaviors/theme";
import type { ResolvedThemeMode } from "@code-ui/miniapp/behaviors/theme";
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
const appThemeBehavior = createAppThemeBehavior();

const relations: Record<string, any> = {};
setupAppRelations(relations, "parent");

Component(
  createComponentOptions({
    behaviors: [
      cuiAppParentBehavior,
      appHostBehavior,
      appThemeBehavior,
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
      colorMode: {
        type: String,
        value: "",
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
      themeMode: "light" as ResolvedThemeMode,
      themeCssVars: "",
    },

    computed: {
      effectiveThemeMode(): ResolvedThemeMode {
        const override = this.data.colorMode;
        if (override === "dark" || override === "light") return override;
        return this.data.themeMode || "light";
      },

      classes() {
        const scaled = this.data.scaled;
        const themeFns = appTheme({ scaled });
        const resolved = resolveSlots(
          themeFns,
          this.data.ui,
          this.data.className,
        );
        const override = this.data.colorMode;
        const mode: ResolvedThemeMode =
          override === "dark" || override === "light"
            ? override
            : this.data.themeMode || "light";
        resolved.root = `${resolved.root} ${mode}`.trim();
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

        const baseStyle = buildRootCssVars(
          layout,
          m,
          topInset,
          bottomInset,
          bgStyle,
        );
        const themeVars = this.data.themeCssVars || "";
        if (!themeVars) return baseStyle;
        return baseStyle
          ? `${baseStyle.endsWith(";") ? baseStyle : `${baseStyle};`}${themeVars}`
          : themeVars;
      },
    },
  }),
);
