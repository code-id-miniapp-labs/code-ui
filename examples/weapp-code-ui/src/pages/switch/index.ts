Page({
  data: {
    controlledChecked: true,
    airplaneMode: false,
    wifiEnabled: true,
    notifications: true,
    lastEvent: "None",
    agreementRules: [
      { required: true, message: "You must accept the terms to proceed" },
    ],
    formEmailNotifications: true,
    switchFormStatus: "",
    switchFormMessage: "",
  },

  onControlledChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      controlledChecked: e.detail.checked,
      lastEvent: `change: ${e.detail.checked}`,
    });
  },

  toggleControlled() {
    const next = !this.data.controlledChecked;
    this.setData({
      controlledChecked: next,
      lastEvent: `toggled to ${next} via button`,
    });
  },

  onAirplaneModeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      airplaneMode: e.detail.checked,
      lastEvent: `Airplane mode: ${e.detail.checked}`,
    });
  },

  onWifiChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      wifiEnabled: e.detail.checked,
      lastEvent: `Wi-Fi: ${e.detail.checked}`,
    });
  },

  onNotificationsChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      notifications: e.detail.checked,
      lastEvent: `Notifications: ${e.detail.checked}`,
    });
  },

  onFormEmailNotificationsChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formEmailNotifications: e.detail.checked,
    });
  },

  toggleFormControlled() {
    this.setData({
      formEmailNotifications: !this.data.formEmailNotifications,
    });
  },

  getSwitchForm(): any {
    return this.selectComponent("#switch-demo-form");
  },

  submitSwitchForm() {
    this.getSwitchForm()?.submit?.();
  },

  resetSwitchForm() {
    this.getSwitchForm()?.reset?.();
    this.setData({
      formEmailNotifications: true,
      switchFormStatus: "",
      switchFormMessage: "",
    });
  },

  handleSwitchFormSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      switchFormStatus: "Success",
      switchFormMessage: `Form submitted: ${JSON.stringify(e.detail.values)}`,
    });
  },

  handleSwitchFormError() {
    this.setData({
      switchFormStatus: "Error",
      switchFormMessage:
        "Please accept the required agreement switch before submitting.",
    });
  },
});
