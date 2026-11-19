import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { createAppThemeBehavior } from "@code-id-labs/miniapp/behaviors/theme";
import type { MiniAppBaseEventLike } from "@code-id-labs/utils";
import { resolveSlots } from "../../utils/ui";
import {
  resolveSubcomponentList,
  resolveTriggerButtonProps,
} from "../../utils/subcomponent";
import { tv } from "../../utils/variants";

import {
  type ActionSheetAction,
  type ActionSheetCloseProps,
  type ActionSheetItem,
  actionSheetMachine,
  connectActionSheet,
  defaultActionSheetProps,
} from "@code-id-labs/action-sheet";
import themeConfig from "virtual:cui/theme/action-sheet";

const actionSheetTheme = tv(themeConfig);

function resolveActionSheetSlots(
  open: boolean,
  disabled: boolean,
  closable: boolean,
  ui: Record<string, string> | undefined,
  className: string | undefined,
) {
  return resolveSlots(
    actionSheetTheme({ open, disabled, closable }),
    ui,
    className,
  );
}

const actionSheetBehavior = createMachineBehavior({
  machine: actionSheetMachine,
  connect: connectActionSheet,
  key: "actionSheet",
  exportApi: true,
  exportApiKeys: [
    "open",
    "visible",
    "loadingActionIndex",
    "setOpen",
    "openActionSheet",
    "closeActionSheet",
    "select",
    "handleAction",
  ],
});

const appThemeBehavior =
  typeof Behavior !== "undefined" ? createAppThemeBehavior() : ({} as any);

Component(
  createComponentOptions({
    behaviors: [appThemeBehavior, actionSheetBehavior, computedBehavior],
    slots: {
      default: false,
      header: false,
      title: false,
      description: false,
      close: false,
      actions: false,
    },

    computed: {
      portalStyle(): string {
        return this.data.portal ? this.data.themeCssVars || "" : "";
      },

      resolvedItems() {
        const rawItems = (this.data.items || []) as ActionSheetItem[];
        return rawItems.map((item, index) => ({
          key: item.key ?? String(index),
          label: item.label,
          description: item.description,
          icon: item.icon,
          loadingIcon: item.loadingIcon || "loading",
          color: item.color,
          destructive: Boolean(item.destructive),
          disabled: Boolean(item.disabled),
          loading: Boolean(item.loading),
          openType: item.openType ?? "",
          className: item.className ?? "",
          style: item.style ?? "",
        }));
      },

      resolvedClose() {
        const classes = this.data.classes as Record<string, string> | undefined;
        return resolveTriggerButtonProps<ActionSheetCloseProps>(
          this.data.close as boolean | ActionSheetCloseProps | null | undefined,
          {
            icon: "close",
            color: "neutral",
            variant: "ghost",
            size: "xs",
            ui: { icon: classes?.closeIcon ?? "" },
          },
          classes?.closeButton,
        );
      },

      resolvedActions() {
        const rawActions = (this.data.actions || []) as ActionSheetAction[];
        const loadingActionIndex =
          (this.data.actionSheet?.loadingActionIndex as
            | number
            | null
            | undefined) ?? null;

        return resolveSubcomponentList<ActionSheetAction>(
          rawActions,
          {
            label: "",
            color: "neutral",
            variant: "ghost",
            size: "xl",
            loadingIcon: "loading",
            loadingAuto: true,
            closeOnClick: true,
            disabled: false,
            loading: false,
            openType: "",
            className: "",
            ui: {},
          },
          "label",
          (action) => {
            action.loading = Boolean(
              action.loading || loadingActionIndex === action.index,
            );
            action.loadingAuto = action.loadingAuto !== false;
            action.closeOnClick = action.closeOnClick !== false;
            action.disabled = Boolean(action.disabled);
            action.ui = action.ui ?? {};
            return action;
          },
        );
      },

      disabledClasses() {
        const { item, itemTitle, itemDescription } = resolveActionSheetSlots(
          false,
          true,
          false,
          this.data.ui,
          this.data.className,
        );
        return { item, itemTitle, itemDescription };
      },

      classes() {
        const isOpen = Boolean(this.data.actionSheet?.open);
        const close = this.data.close;
        const closable = Boolean(
          this.data.slots?.close ||
            close === true ||
            (typeof close === "string" && close.length > 0) ||
            (typeof close === "object" && close !== null),
        );
        return resolveActionSheetSlots(
          isOpen,
          false,
          closable,
          this.data.ui,
          this.data.className,
        );
      },
    },

    properties: createProperties(defaultActionSheetProps, {
      className: {
        type: String,
        value: "",
      },
      title: {
        type: String,
        value: "",
      },
      description: {
        type: String,
        value: "",
      },
      close: {
        type: null,
        value: false,
      },
      portal: {
        type: Boolean,
        value: true,
      },
      ui: {
        type: Object,
        value: {},
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
