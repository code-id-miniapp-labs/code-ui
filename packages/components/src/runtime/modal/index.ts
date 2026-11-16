import type { MiniAppBaseEventLike } from "@code-ui/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties } from "../_shared/machine";
import { resolveSlots } from "../../utils/ui";
import { resolveTriggerButtonProps } from "../../utils/subcomponent";
import {
  type ModalCloseProps,
  connectModal,
  defaultModalProps,
  modalMachine,
} from "@code-ui/modal";
import themeConfig from "virtual:cui/theme/modal";
import { tv } from "../../utils/variants";

const modalTheme = tv(themeConfig);

const modalBehavior = createMachineBehavior({
  machine: modalMachine,
  connect: connectModal,
  key: "modal",
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [modalBehavior, computedBehavior],
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
      variant: {
        type: String,
        value: "default",
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
      resolvedClose() {
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
          variant: this.data.variant,
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
        this.send({ type: "TRIGGER.TAP" });
      },

      handleOverlayTap(ev: MiniAppBaseEventLike) {
        this.send({ type: "OVERLAY.TAP" });
        this.triggerEvent("overlayTap", ev);
      },

      handleContainerTap(ev: MiniAppBaseEventLike) {
        const targetId = ev?.target?.id;
        const currentId = ev?.currentTarget?.id;
        if (targetId && currentId && targetId === currentId) {
          this.send({ type: "OVERLAY.TAP" });
          this.triggerEvent("overlayTap", ev);
        }
      },

      handleCloseTap(ev: MiniAppBaseEventLike) {
        this.send({ type: "CLOSE_TRIGGER.TAP" });
        this.triggerEvent("closeTriggerTap", ev);
      },
    },
  }),
);
