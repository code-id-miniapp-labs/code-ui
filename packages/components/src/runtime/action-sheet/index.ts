import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import type { MiniAppBaseEventLike } from "@code-ui/utils";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";

import {
  actionSheetMachine,
  connectActionSheet,
  defaultActionSheetProps,
} from "@code-ui/action-sheet";
import themeConfig from "virtual:cui/theme/action-sheet";

const actionSheetTheme = tv(themeConfig);

const actionSheetBehavior = createMachineBehavior({
  machine: actionSheetMachine,
  connect: connectActionSheet,
  key: "actionSheet",
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [actionSheetBehavior, computedBehavior],
    slots: {
      default: false,
      header: false,
      title: false,
      description: false,
      close: false,
      actions: false,
    },

    computed: {
      classes() {
        const api = this.data.actionSheet;
        const isOpen = Boolean(api?.open);
        const ui = this.data.ui;

        const themeFns = actionSheetTheme({
          open: isOpen,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    properties: createProperties(defaultActionSheetProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    methods: {
      noop() {},

      handleBackdropTap(ev: WechatMiniprogram.CustomEvent) {
        this.send({ type: "BACKDROP.TAP" });
        this.triggerEvent("backdropTap", ev);
      },

      handleCloseTriggerTap(ev: WechatMiniprogram.CustomEvent) {
        this.send({ type: "CLOSE_TRIGGER.TAP" });
        this.triggerEvent("closeTriggerTap", ev);
      },

      handleItemTap(
        this: any,
        ev: MiniAppBaseEventLike<{ index?: number | string }>,
      ) {
        const raw = ev.currentTarget?.dataset?.index;
        const index = raw !== undefined ? Number(raw) : NaN;
        if (!Number.isNaN(index)) {
          getApi(this, "actionSheet")?.select(index);
        }
      },

      handleActionTap(
        this: any,
        event: MiniAppBaseEventLike<{ index?: number | string }>,
      ) {
        const raw = event.currentTarget?.dataset?.index;
        const index = raw !== undefined ? Number(raw) : NaN;
        if (!Number.isNaN(index)) {
          getApi(this, "actionSheet")?.handleAction(index);
        }
      },

      handleGetPhoneNumber(ev: WechatMiniprogram.CustomEvent) {
        this.triggerEvent("getphonenumber", ev.detail);
      },

      handleChooseAvatar(ev: WechatMiniprogram.CustomEvent) {
        this.triggerEvent("chooseavatar", ev.detail);
      },

      handleContact(ev: WechatMiniprogram.CustomEvent) {
        this.triggerEvent("contact", ev.detail);
      },
    },
  }),
);
