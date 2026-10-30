import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties } from "../_shared/machine";
import {
  notifyScaleGestureEnd,
  notifyScaleGestureProgress,
  notifyScaleGestureStart,
  withAppScale,
  withScrollLock,
} from "@code-ui/miniapp/behaviors/app";
import { resolveSlots } from "../../utils/ui";

import {
  drawerMachine,
  connectDrawer,
  defaultDrawerProps,
} from "@code-ui/drawer";
import themeConfig from "virtual:cui/theme/drawer";
import { tv } from "../../utils/variants";

const drawerTheme = tv(themeConfig);

const drawerBehavior = createMachineBehavior({
  machine: drawerMachine,
  connect: connectDrawer,
  key: "drawer",
  exportApi: true,
  syncProps: [
    "lockScroll",
    "shouldScaleBackground",
    "scaleFactor",
    "scaleBackground",
  ],
  plugins: [
    withScrollLock({
      idPrefix: "drawer",
    }),
    withAppScale({
      idPrefix: "drawer",
    }),
  ],
});

Component(
  createComponentOptions({
    behaviors: [drawerBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    computed: {
      classes() {
        const api = this.data.drawer;
        const placement = api?.placement ?? this.data.placement;
        const isOpen = Boolean(api?.open ?? this.data.open);
        const ui = this.data.ui;

        const themeFns = drawerTheme({
          placement,
          open: isOpen,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    lifetimes: {
      attached() {
        const handler: WechatMiniprogram.OnKeyboardHeightChangeCallback = (
          res,
        ) => {
          this.send({ type: "KEYBOARD_CHANGE", height: res.height });
        };
        this._kbHandler = handler;
        if (typeof wx !== "undefined" && wx.onKeyboardHeightChange) {
          wx.onKeyboardHeightChange(handler);
        }
      },
      detached(this: any) {
        if (this._isDragging) {
          this._isDragging = false;
          if (this.data.shouldScaleBackground) {
            notifyScaleGestureEnd(this, false);
          }
        }
        const handler = this._kbHandler;
        if (
          handler &&
          typeof wx !== "undefined" &&
          wx.offKeyboardHeightChange
        ) {
          wx.offKeyboardHeightChange(handler);
        }
      },
    },

    properties: createProperties(defaultDrawerProps, {
      className: {
        type: String,
        value: "",
      },
      lockScroll: {
        type: Boolean,
        value: true,
      },
    }),

    methods: {
      noop() {},

      handleBackdropTap(ev: WechatMiniprogram.CustomEvent) {
        this.send({ type: "BACKDROP.TAP" });
        this.triggerEvent("backdropTap", ev);
        this.triggerEvent("close", { reason: "backdrop" });
      },

      handleCloseTap(ev: WechatMiniprogram.CustomEvent) {
        this.send({ type: "CLOSE_TRIGGER.TAP" });
        this.triggerEvent("closeTriggerTap", ev);
        this.triggerEvent("close", { reason: "close-trigger" });
      },

      handleTouchStart(this: any, value?: any) {
        this._isDragging = true;
        if (this.data.shouldScaleBackground) {
          notifyScaleGestureStart(this);
        }
        this.send({ type: "DRAG_START" });
        this.triggerEvent("dragstart", value || {});
      },

      handleTouchMove(this: any, value?: any) {
        this.triggerEvent("drag", value || {});
        if (!this.data.shouldScaleBackground || !this._isDragging) return;

        const offset = typeof value?.offset === "number" ? value.offset : 0;
        this._latestDragOffset = offset;

        if (!this._dragRafPending) {
          this._dragRafPending = true;
          const schedule =
            typeof wx !== "undefined" && typeof wx.nextTick === "function"
              ? wx.nextTick
              : (fn: () => void) => setTimeout(fn, 16);

          schedule(() => {
            this._dragRafPending = false;
            if (this._isDragging) {
              const threshold = this.data.threshold || 80;
              const maxDistance = Math.max(threshold * 1.5, 120);
              const progress = Math.min(
                1,
                Math.max(0, this._latestDragOffset / maxDistance),
              );
              notifyScaleGestureProgress(this, progress);
            }
          });
        }
      },

      handleTouchEnd(this: any, value?: { passed: boolean; offset?: number }) {
        const passed = value ? value.passed : false;
        this._isDragging = false;
        this._dragRafPending = false;
        if (this.data.shouldScaleBackground) {
          notifyScaleGestureEnd(this, passed);
        }
        this.send({ type: "DRAG_END", passed });
        this.triggerEvent("dragend", value || { passed: false });
      },
    },
  }),
);
