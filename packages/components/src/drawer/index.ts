import { createMachineBehavior, createProperties } from "../_shared/runtime";
import {
  drawerMachine,
  connectDrawer,
  defaultDrawerProps,
} from "@code-ui/drawer";

const drawerBehavior = createMachineBehavior({
  machine: drawerMachine,
  connect: connectDrawer,
  key: "drawer",
  exportApi: true,
});

Component({
  behaviors: [drawerBehavior],

  options: {
    multipleSlots: true,
    addGlobalClass: true,
    styleIsolation: "apply-shared",
  },

  lifetimes: {
    attached() {
      const handler: WechatMiniprogram.OnKeyboardHeightChangeCallback = (
        res,
      ) => {
        this.send({ type: "KEYBOARD_CHANGE", height: res.height });
      };
      (this as any)._kbHandler = handler;
      if (typeof wx !== "undefined" && wx.onKeyboardHeightChange) {
        wx.onKeyboardHeightChange(handler);
      }
    },
    detached() {
      const handler = (this as any)._kbHandler;
      if (handler && typeof wx !== "undefined" && wx.offKeyboardHeightChange) {
        wx.offKeyboardHeightChange(handler);
      }
    },
  },

  properties: createProperties(defaultDrawerProps),

  methods: {
    noop() {},

    handleBackdropTap(ev: WechatMiniprogram.CustomEvent) {
      this.send({ type: "BACKDROP.TAP" });
      this.triggerEvent("backdropTap", ev);
    },

    handleCloseTap(ev: WechatMiniprogram.CustomEvent) {
      this.send({ type: "CLOSE_TRIGGER.TAP" });
      this.triggerEvent("closeTriggerTap", ev);
    },

    handleTouchStart(value?: any) {
      this.send({ type: "DRAG_START" });
      this.triggerEvent("dragstart", value || {});
    },

    handleTouchMove(value?: any) {
      this.triggerEvent("drag", value || {});
    },

    handleTouchEnd(value?: { passed: boolean; offset?: number }) {
      const passed = value ? value.passed : false;
      this.send({ type: "DRAG_END", passed });
      this.triggerEvent("dragend", value || { passed: false });
    },
  },
});
