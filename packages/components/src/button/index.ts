import { createMachineBehavior, buttonMachine, connectButton } from "../index";

const buttonBehavior = createMachineBehavior({
  machine: buttonMachine,
  connect: connectButton,
  key: "button",
  syncProps: [
    "ui",
    "loading",
    "disabled",
    "variant",
    "size",
    "loadingAuto",
    "autoResetDuration",
  ],
  exportApi: true,
});

Component({
  behaviors: [buttonBehavior],

  options: {
    multipleSlots: true,
    addGlobalClass: true,
    styleIsolation: "apply-shared",
  },

  properties: {
    ui: {
      type: Object,
      value: {},
    },
    loading: {
      type: Boolean,
      value: false,
    },

    disabled: {
      type: Boolean,
      value: false,
    },
    variant: {
      type: String,
      value: "primary",
    },
    size: {
      type: String,
      value: "md",
    },
    loadingAuto: {
      type: Boolean,
      value: false,
    },
    autoResetDuration: {
      type: Number,
      value: 1500,
    },
    openType: {
      type: String,
      value: "",
    },
    formType: {
      type: String,
      value: "",
    },
  },

  methods: {
    handleTap(e: WechatMiniprogram.TouchEvent) {
      const buttonData = (this.data as any).button;
      if (buttonData?.disabled || buttonData?.loading) return;
      this.send({ type: "TAP", event: e });
      this.triggerEvent("tap", e);
      this.triggerEvent("click", e);
    },

    handleGetPhoneNumber(e: any) {
      this.triggerEvent("getphonenumber", e.detail);
    },

    handleChooseAvatar(e: any) {
      this.triggerEvent("chooseavatar", e.detail);
    },
  },
});
