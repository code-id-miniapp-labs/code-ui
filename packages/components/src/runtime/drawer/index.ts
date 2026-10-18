import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
} from "../_shared";
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
      classes() {
        const placement = this.data.placement;
        const ui = this.data.ui;
        const isOpen = this.data.drawer?.open ?? false;

        const themeFns = drawerTheme({
          placement,
          open: isOpen,
        });

        return resolveSlots(themeFns, ui, this.data.class);
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
      class: {
        type: String,
        value: "",
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
