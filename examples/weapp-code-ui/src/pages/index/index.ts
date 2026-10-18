interface FormComponentRef {
  submit?: () => Promise<any>;
  reset?: (name?: string | string[]) => void;
  resetValidation?: (name?: string | string[]) => void;
  setErrors?: (errors: Record<string, string | string[]>) => void;
}

Page({
  data: {
    drawerOpen: false,
    drawerPlacement: "bottom",
    count: 0,
    customButtonUI: {
      root: "shadow-md ring-2 ring-emerald-400 ring-offset-2",
    },
    pinRules: [
      { required: true, message: "Security PIN is required" },
      { exactLength: 4, message: "Security PIN must be all 4 digits" },
      { numeric: true, message: "Security PIN must contain digits 0-9 only" },
    ],
    confirmPinRules: [
      { required: true, message: "Please confirm your Security PIN" },
      { exactLength: 4, message: "Confirmation PIN must be all 4 digits" },
      {
        sameAs: "pin",
        message: "Confirmation PIN does not match Security PIN",
      },
    ],
    transferPinRules: [
      { required: true, message: "Transfer authorization PIN is required" },
      { exactLength: 6, message: "Authorization PIN must be 6 digits" },
    ],
    formStatus: "",
    formMessage: "",
    transferStatus: "",
    transferMessage: "",
    requirePin: false,
  },

  getDemoForm(): FormComponentRef | null {
    return this.selectComponent("#demo-form") as FormComponentRef | null;
  },

  onTogglePin() {
    this.setData({
      requirePin: !this.data.requirePin,
    });
  },

  submitDemoForm() {
    this.getDemoForm()?.submit?.();
  },

  resetDemoForm() {
    this.getDemoForm()?.reset?.();
  },

  clearDemoFormErrors() {
    this.getDemoForm()?.resetValidation?.();
    this.setData({
      formStatus: "Cleared",
      formMessage: "Validation errors cleared without resetting field values.",
    });
  },

  simulateServerError() {
    this.getDemoForm()?.setErrors?.({
      pin: ["Server rejected PIN: Weak PIN sequence (e.g. 1234)"],
    });
    this.setData({
      formStatus: "Server Error",
      formMessage: "Injected server-side error into errorBag.pin.",
    });
  },

  handleFormSubmit(e: WechatMiniprogram.CustomEvent) {
    const values = e?.detail?.values ?? {};
    const pinStr = Array.isArray(values.pin)
      ? values.pin.join("")
      : String(values.pin ?? "");
    this.setData({
      formStatus: "Submitted",
      formMessage: `PIN "${pinStr}" verified successfully!`,
    });
    wx.showToast({
      title: "Form Valid!",
      icon: "success",
    });
  },

  handleFormError(e: WechatMiniprogram.CustomEvent) {
    const errors = e?.detail?.errors ?? [];
    this.setData({
      formStatus: "Invalid",
      formMessage: `${errors.length} field(s) failed validation. Focused first error.`,
    });
  },

  handleFormReset() {
    this.setData({
      formStatus: "Reset",
      formMessage: "All form values and errorBag entries have been reset.",
    });
  },

  getTransferForm(): FormComponentRef | null {
    return this.selectComponent("#transfer-form") as FormComponentRef | null;
  },

  submitTransferForm() {
    this.getTransferForm()?.submit?.();
  },

  resetTransferForm() {
    this.getTransferForm()?.reset?.();
  },

  handleTransferSubmit(e: WechatMiniprogram.CustomEvent) {
    const values = e?.detail?.values ?? {};
    const pinStr = Array.isArray(values.pin)
      ? values.pin.join("")
      : String(values.pin ?? "");
    this.setData({
      transferStatus: "Transfer Authorized",
      transferMessage: `Transfer PIN "${pinStr}" approved! $250.00 transferred successfully.`,
    });
    wx.showToast({
      title: "Transfer Sent!",
      icon: "success",
    });
  },

  handleTransferError(e: WechatMiniprogram.CustomEvent) {
    const errors = e?.detail?.errors ?? [];
    this.setData({
      transferStatus: "Transfer Denied",
      transferMessage: `${errors.length} field(s) invalid. Please enter all 6 digits.`,
    });
  },

  openBottomDrawer() {
    this.setData({
      drawerPlacement: "bottom",
      drawerOpen: true,
    });
  },

  openTopDrawer() {
    this.setData({
      drawerPlacement: "top",
      drawerOpen: true,
    });
  },

  closeDrawer() {
    this.setData({
      drawerOpen: false,
    });
  },

  handleAsyncAction() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.setData({
          count: this.data.count + 1,
        });
        wx.showToast({
          title: "Async action complete!",
          icon: "success",
        });
        resolve(true);
      }, 1200);
    });
  },

  increment() {
    this.setData({
      count: this.data.count + 1,
    });
  },
});
