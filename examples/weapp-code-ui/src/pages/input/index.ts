Page({
  data: {
    controlledValue: "Hello Code UI",
    clearableValue: "Click ✕ to clear",
    passwordValue: "secret123",
    lastEvent: "None",
  },

  onControlledInput(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      controlledValue: e.detail.value,
      lastEvent: `input: "${e.detail.value}"`,
    });
  },

  setControlledPredefined() {
    this.setData({
      controlledValue: "Antigravity UI",
      lastEvent: 'set to "Antigravity UI"',
    });
  },

  clearControlled() {
    this.setData({
      controlledValue: "",
      lastEvent: "cleared programmatically",
    });
  },

  onClearableChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      clearableValue: e.detail.value,
    });
  },

  onInputFocus(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      lastEvent: `focused (val: "${e.detail.value || ""}")`,
    });
  },

  onInputBlur(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      lastEvent: `blurred (val: "${e.detail.value || ""}")`,
    });
  },

  onInputClear() {
    this.setData({
      clearableValue: "",
      lastEvent: "cleared via clearable button",
    });
  },
});
