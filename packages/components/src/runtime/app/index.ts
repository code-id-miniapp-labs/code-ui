import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  appMetricsSignal,
  cuiAppParentBehavior,
  refreshAppMetrics,
  registerAppHost,
  setAppHostVisible,
  setupAppRelations,
  unregisterAppHost,
} from "@code-ui/miniapp/behaviors/app";
import type { AppHostState, AppMetrics } from "@code-ui/miniapp/behaviors/app";
import {
  getToastManager,
  registerToastHost,
  removeToast,
  unregisterToastHost,
  updateToastHostConfig,
} from "@code-ui/miniapp/behaviors/toast";
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

const relations: Record<string, any> = {};
setupAppRelations(relations, "parent");

Component(
  createComponentOptions({
    behaviors: [cuiAppParentBehavior, computedBehavior],
    relations,

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
        const scaled = Boolean(this.data.scaled);
        const themeFns = appTheme({ scaled });
        const resolved = resolveSlots(
          themeFns,
          this.data.ui,
          this.data.className,
        );
        if (scaled) {
          const bg =
            this.data.hostScaleBackground ||
            this.data.scaleBackground ||
            "bg-black";
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
        const scaled = Boolean(this.data.scaled);
        if (!scaled) {
          return "";
        }
        const factor =
          this.data.hostScaleFactor || this.data.scaleFactor || 0.94;
        return `transform: scale(${factor}) translateY(var(--cui-top-offset));`;
      },

      rootStyle() {
        const m: AppMetrics = appMetricsSignal();
        const topInset: number = this.data.topInset || 0;
        const bottomInset: number = this.data.bottomInset || 0;

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

        const scaled = Boolean(this.data.scaled);
        const bg =
          this.data.hostScaleBackground || this.data.scaleBackground || "";
        const bgStyle =
          scaled && (bg.startsWith("#") || bg.startsWith("rgb"))
            ? `background-color:${bg};`
            : "";

        return buildRootCssVars(layout, m, topInset, bottomInset, bgStyle);
      },
    },

    observers: {
      maxToasts(this: any, value: number) {
        if (!this.__cuiAppAttached) return;
        if (value !== undefined) {
          updateToastHostConfig(this, { max: value });
        }
      },
    },

    lifetimes: {
      attached(this: any) {
        this.__cuiAppAttached = true;
        registerAppHost(this, {
          onChange: (state: AppHostState) => this.applyHostState(state),
        });
        registerToastHost(
          this,
          (toasts: ToastEntry[]) => {
            this.setData({ toasts });
          },
          { max: this.data.maxToasts ?? 2 },
        );
        this.toastManager = getToastManager(this);
        if (typeof getCurrentPages === "function") {
          try {
            const pages = getCurrentPages();
            const topPage = pages && pages[pages.length - 1];
            if (topPage) {
              topPage.__cuiApp = this;
            }
          } catch {}
        }
      },

      detached(this: any) {
        this.__cuiAppAttached = false;
        unregisterToastHost(this);
        unregisterAppHost(this);
      },

      ready(this: any) {
        this.detectCustomBars();
        wx.nextTick(() => {
          if (this.__cuiAppAttached) {
            this.detectCustomBars();
          }
        });
      },
    },

    pageLifetimes: {
      show(this: any) {
        if (typeof getCurrentPages === "function") {
          try {
            const pages = getCurrentPages();
            const topPage = pages && pages[pages.length - 1];
            if (topPage) {
              topPage.__cuiApp = this;
            }
          } catch {}
        }
        setAppHostVisible(this, true);
        this.detectCustomBars();
      },
      hide(this: any) {
        setAppHostVisible(this, false);
      },
      resize(this: any) {
        refreshAppMetrics();
        this.detectCustomBars();
      },
    },

    methods: {
      noop() {},

      detectCustomBars(this: any) {
        if (!this.data.autoDetectBars) return;
        if (
          typeof wx === "undefined" ||
          typeof wx.createSelectorQuery !== "function"
        ) {
          return;
        }
        try {
          const applyRects = (topRect: any, bottomRect: any) => {
            if (!this.__cuiAppAttached) return;
            const patch: Record<string, any> = {};

            if (topRect && typeof topRect.height === "number") {
              const topHeight = extractTopBarHeight(topRect);
              if (topHeight !== this.data.detectedTopBarHeight) {
                patch.detectedTopBarHeight = topHeight;
              }
            }

            if (bottomRect && typeof bottomRect.height === "number") {
              const bottomHeight = extractBottomBarHeight(bottomRect);
              if (bottomHeight !== this.data.detectedBottomBarHeight) {
                patch.detectedBottomBarHeight = bottomHeight;
              }
            }

            if (Object.keys(patch).length > 0) {
              this.setData(patch);
            }
          };

          detectBars(this, ({ topRect, bottomRect }) => {
            applyRects(topRect, bottomRect);
          });
        } catch {}
      },

      removeToast(this: any, id: string) {
        return removeToast(id, this);
      },

      handleToastDismiss(this: any, event: any) {
        const id =
          event.detail?.id ||
          event.currentTarget?.dataset?.id ||
          event.target?.dataset?.id;
        if (id) {
          removeToast(id, this);
        }
      },

      startScaleGesture(this: any) {
        this._lastScaleProgress = undefined;
      },

      applyScaleProgress(this: any, progress: number) {
        const lastP = this._lastScaleProgress ?? -1;
        if (
          Math.abs(progress - lastP) < 0.008 &&
          progress > 0 &&
          progress < 1
        ) {
          return;
        }
        this._lastScaleProgress = progress;

        const factor =
          this.data.hostScaleFactor || this.data.scaleFactor || 0.94;
        const currentScale = factor + (1 - factor) * progress;
        const currentRadius = Math.round(16 * (1 - progress));
        const currentTopFactor = Math.max(0, 1 - progress);

        this.setData({
          gestureScaleStyle:
            `transform: scale(${Math.round(currentScale * 1000) / 1000}) translateY(calc(var(--cui-top-offset) * ${Math.round(currentTopFactor * 1000) / 1000})); ` +
            `border-radius: ${currentRadius}px; ` +
            `transition: none !important;`,
        });
      },

      endScaleGesture(this: any, passed: boolean) {
        this._lastScaleProgress = undefined;
        const patch: Record<string, any> = { gestureScaleStyle: "" };
        if (passed) {
          patch.scaled = false;
        }
        this.setData(patch);
      },

      applyHostState(this: any, state: AppHostState) {
        const patch: Record<string, any> = {};
        if (state.scale) {
          const wantScaled = Boolean(state.scale.scaled);
          if (wantScaled !== Boolean(this.data.scaled)) {
            patch.scaled = wantScaled;
          }
          if (state.scale.factor !== this.data.hostScaleFactor) {
            patch.hostScaleFactor = state.scale.factor;
          }
          if (state.scale.background !== this.data.hostScaleBackground) {
            patch.hostScaleBackground = state.scale.background ?? "";
          }
        }
        if (
          state.insets.top !== this.data.topInset ||
          state.insets.bottom !== this.data.bottomInset
        ) {
          patch.topInset = state.insets.top;
          patch.bottomInset = state.insets.bottom;
        }
        if (Object.keys(patch).length > 0) {
          this.setData(patch);
        }
        if (this.data.autoDetectBars && this.data.detectedTopBarHeight === 0) {
          this.detectCustomBars();
        }
      },
    },
  }),
);
