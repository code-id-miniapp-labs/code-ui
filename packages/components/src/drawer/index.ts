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

    handleBackdropTap() {
      this.send({ type: "BACKDROP.TAP" });
      this.triggerEvent("backdroptap");
    },

    handleCloseTap() {
      this.send({ type: "CLOSE_TRIGGER.TAP" });
      this.triggerEvent("closetap");
    },

    handleTouchStart(e: WechatMiniprogram.TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      this.send({
        type: "SWIPE_START",
        point: { x: touch.clientX, y: touch.clientY },
      });
    },

    handleTouchMove(e: WechatMiniprogram.TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      this.send({
        type: "SWIPE_MOVE",
        point: { x: touch.clientX, y: touch.clientY },
      });
    },

    handleTouchEnd() {
      this.send({ type: "SWIPE_END" });
    },
  },
});
