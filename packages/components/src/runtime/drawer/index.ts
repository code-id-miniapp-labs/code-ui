import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
} from "../_shared";
import { getResolvedTheme, resolveSlots } from "../utils/ui";

import {
  drawerMachine,
  connectDrawer,
  defaultDrawerProps,
} from "@code-ui/drawer";
import { drawerTheme } from "./theme";

const drawerBehavior = createMachineBehavior({
  machine: drawerMachine,
  connect: connectDrawer,
  key: "drawer",
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [drawerBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      addGlobalClass: true,
      styleIsolation: "apply-shared",
    },

    computed: {
      classes(this: any) {
        const placement = this.data.placement;
        const ui = this.data.ui;
        const isOpen = this.data.drawer?.open ?? false;

        const theme = getResolvedTheme("drawer", drawerTheme);
        const themeFns = theme({
          placement,
          open: isOpen,
        });

        return resolveSlots(themeFns, ui);
      },
    },

    lifetimes: {
      attached(this: any) {
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

    properties: createProperties(defaultDrawerProps),

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
  }),
);
