import type { MiniAppBaseEventLike } from "@code-id-labs/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { createAppThemeBehavior } from "@code-id-labs/miniapp/behaviors/theme";
import { resolveSlots } from "../../utils/ui";
import { resolveTriggerButtonProps } from "../../utils/subcomponent";
import {
  type ModalApi,
  type ModalCloseProps,
  connectModal,
  defaultModalProps,
  modalMachine,
} from "@code-id-labs/modal";
import themeConfig from "virtual:cui/theme/modal";
import { tv } from "../../utils/variants";

const modalTheme = tv(themeConfig);

const modalBehavior = createMachineBehavior({
  machine: modalMachine,
  connect: connectModal,
  key: "modal",
  deferred: true,
  shouldStart: (props) => Boolean(props.open || props.defaultOpen),
  exportApi: true,
  exportApiKeys: ["open", "visible", "setOpen", "openModal", "closeModal", "toggle"],
});

const appThemeBehavior =
  typeof Behavior !== "undefined" ? createAppThemeBehavior() : ({} as any);

Component(
  createComponentOptions({
    behaviors: [appThemeBehavior, modalBehavior, computedBehavior],
    slots: {
      default: false,
      trigger: false,
      content: false,
      header: false,
      title: false,
      description: false,
      close: false,
      body: false,
      footer: false,
    },

    properties: createProperties(defaultModalProps, {
      title: {
        type: String,
        value: "",
      },
      description: {
        type: String,
        value: "",
      },
      overlay: {
        type: Boolean,
        value: true,
      },
      scrollable: {
        type: Boolean,
        value: false,
      },
      fullscreen: {
        type: Boolean,
        value: false,
      },
      size: {
        type: String,
        value: "md",
      },
      close: {
        type: null,
        value: true,
      },
      closeIcon: {
        type: String,
        value: "",
      },
      portal: {
        type: Boolean,
        value: true,
      },
      enhanced: {
        type: Boolean,
        value: true,
      },
      bounces: {
        type: Boolean,
        value: false,
      },
      showScrollbar: {
        type: Boolean,
        value: false,
      },
      ui: {
        type: Object,
        value: {},
      },
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      portalStyle(): string {
        return this.data.portal ? this.data.themeCssVars || "" : "";
      },

      resolvedClose() {
        if (!this.data.modal?.visible) return null;
        const classes = this.data.classes as Record<string, string> | undefined;
        const closeIcon =
          (this.data.closeIcon as string | undefined) || "close";
        return resolveTriggerButtonProps<ModalCloseProps>(
          this.data.close as boolean | ModalCloseProps | null | undefined,
          {
            icon: closeIcon,
            color: "neutral",
            variant: "ghost",
            size: "xs",
            ui: { icon: classes?.closeIcon ?? "" },
          },
          classes?.closeButton,
        );
      },

      classes() {
        const api = this.data.modal;
        if (!api?.visible && !this.data.slots?.trigger) {
          return {};
        }
        const isOpen = Boolean(api?.open);
        const hasBody = Boolean(
          this.data.slots?.body || this.data.slots?.default,
        );
        const hasFooter = Boolean(this.data.slots?.footer);
        const closable = Boolean(
          this.data.slots?.close ||
          (this.data.close !== false && this.data.close !== null),
        );

        const themeFns = modalTheme({
          size: this.data.size,
          fullscreen: Boolean(this.data.fullscreen),
          scrollable: Boolean(this.data.scrollable),
          closable,
          hasBody,
          hasFooter,
          transition: this.data.transition !== false,
          open: isOpen,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      noop() {},

      handleTriggerTap() {
        getApi<ModalApi>(this, "modal")?.handleTriggerTap();
      },

      handleOverlayTap() {
        getApi<ModalApi>(this, "modal")?.handleOverlayTap();
      },

      handleContainerTap(ev: MiniAppBaseEventLike) {
        const targetId = ev?.target?.id;
        const currentId = ev?.currentTarget?.id;
        if (targetId && currentId && targetId === currentId) {
          getApi<ModalApi>(this, "modal")?.handleOverlayTap();
        }
      },

      handleCloseTap() {
        getApi<ModalApi>(this, "modal")?.handleCloseTriggerTap();
      },
    },
  }),
);
