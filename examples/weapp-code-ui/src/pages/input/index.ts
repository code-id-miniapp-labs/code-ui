Page({
  data: {
    controlledValue: "Hello Code UI",
    clearableValue: "Tap clear icon to reset",
    passwordValue: "secret123",
    lastEvent: "None",
    variants: ["outline", "soft", "subtle", "ghost", "none"] as const,
    sizes: ["xs", "sm", "md", "lg", "xl"] as const,
    colors: [
      "primary",
      "secondary",
      "neutral",
      "success",
      "warning",
      "danger",
      "info",
    ] as const,
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
    this.setData({ clearableValue: e.detail.value });
  },

  onInputFocus(e: WechatMiniprogram.CustomEvent) {
    this.setData({ lastEvent: `focused ("${e.detail.value || ""}")` });
  },

  onInputBlur(e: WechatMiniprogram.CustomEvent) {
    this.setData({ lastEvent: `blurred ("${e.detail.value || ""}")` });
  },

  onInputClear() {
    this.setData({
      clearableValue: "",
      lastEvent: "cleared via clearable button",
    });
  },
});
