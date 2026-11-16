Page({
  data: {
    controlledPin: ["1", "2", "", ""],
    pinCompleteValue: "",
    alphaPin: ["A", "7", "", ""],
    variants: ["outline", "soft", "subtle", "ghost", "none"] as const,
    colors: [
      "primary",
      "secondary",
      "neutral",
      "success",
      "warning",
      "danger",
      "info",
    ] as const,
    sizes: ["xs", "sm", "md", "lg", "xl"] as const,
  },

  onPinChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ controlledPin: e.detail.value });
  },

  onPinComplete(e: WechatMiniprogram.CustomEvent) {
    this.setData({ pinCompleteValue: e.detail.valueAsString });
  },

  fillPin() {
    this.setData({
      controlledPin: ["9", "8", "7", "6"],
      pinCompleteValue: "9876",
    });
  },

  clearPin() {
    this.setData({
      controlledPin: ["", "", "", ""],
      pinCompleteValue: "",
    });
  },

  onAlphaChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ alphaPin: e.detail.value });
  },
});
