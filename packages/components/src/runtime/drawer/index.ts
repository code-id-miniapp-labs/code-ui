import type { MiniAppBaseEventLike } from "@code-ui/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties } from "../_shared/machine";
import {
  notifyScaleGestureDragEnd,
  notifyScaleGestureDragMove,
  notifyScaleGestureDragStart,
  withAppScale,
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
    "shouldScaleBackground",
    "scaleFactor",
    "scaleBackground",
  ],
  plugins: [
    withAppScale({
      idPrefix: "drawer",
    }),
  ],
});

Component(
  createComponentOptions({
    behaviors: [drawerBehavior, computedBehavior],

    computed: {
      classes() {
        const api = this.data.drawer;
        const placement = this.data.placement;
        const isOpen = Boolean(api?.open);
        const ui = this.data.ui;

        const themeFns = drawerTheme({
          placement,
          open: isOpen,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    properties: createProperties(defaultDrawerProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    methods: {
      noop() {},

      handleBackdropTap(ev: MiniAppBaseEventLike) {
        this.send({ type: "BACKDROP.TAP" });
        this.triggerEvent("backdropTap", ev);
        this.triggerEvent("close", { reason: "backdrop" });
      },

      handleCloseTap(ev: MiniAppBaseEventLike) {
        this.send({ type: "CLOSE_TRIGGER.TAP" });
        this.triggerEvent("closeTriggerTap", ev);
        this.triggerEvent("close", { reason: "close-trigger" });
      },

      handleTouchStart(value?: { offset?: number }) {
        notifyScaleGestureDragStart(this);
        this.send({ type: "DRAG_START" });
        this.triggerEvent("dragstart", value || {});
      },

      handleTouchMove(value?: { offset?: number }) {
        this.triggerEvent("drag", value || {});
        notifyScaleGestureDragMove(
          this,
          typeof value?.offset === "number" ? value.offset : 0,
        );
      },

      handleTouchEnd(value?: { passed: boolean; offset?: number }) {
        const passed = value ? value.passed : false;
        notifyScaleGestureDragEnd(this, passed);
        this.send({ type: "DRAG_END", passed });
        this.triggerEvent("dragend", value || { passed: false });
      },
    },
  }),
);
