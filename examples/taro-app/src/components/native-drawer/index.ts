import { createMachineBehavior } from "@code-ui/miniapp";
import { drawerMachine, connectDrawer } from "@code-ui/drawer";

const drawerBehavior = createMachineBehavior({
  machine: drawerMachine,
  connect: connectDrawer,
  key: "drawer",
  syncProps: [
    "open",
    "placement",
    "closeOnBackdropClick",
    "dismissible",
    "threshold",
    "duration",
  ],
  exportApi: true,
});

Component({
  behaviors: [drawerBehavior],

  options: {
    multipleSlots: true,
    addGlobalClass: true,
  },

  lifetimes: {
    attached() {
      const handler: WechatMiniprogram.OnKeyboardHeightChangeCallback = (res) => {
        this.send({ type: "KEYBOARD_CHANGE", height: res.height });
      };
      (this as any)._keyboardHandler = handler;
      if (typeof wx !== "undefined" && wx.onKeyboardHeightChange) {
        wx.onKeyboardHeightChange(handler);
      }
    },
    detached() {
      const handler = (this as any)._keyboardHandler;
      if (handler && typeof wx !== "undefined" && wx.offKeyboardHeightChange) {
        wx.offKeyboardHeightChange(handler);
      }
    },
  },

  properties: {
    open: {
      type: Boolean,
      value: false,
    },
    placement: {
      type: String,
      value: "bottom",
    },
    closeOnBackdropClick: {
      type: Boolean,
      value: true,
    },
    dismissible: {
      type: Boolean,
      value: true,
    },
    threshold: {
      type: Number,
      value: 80,
    },
    duration: {
      type: Number,
      value: undefined,
    },
  },

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
