Page({
  data: {
    controlledPin: ["1", "2", "", ""],
    pinCompleteValue: "",
  },

  onPinChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      controlledPin: e.detail.value,
    });
  },

  onPinComplete(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      pinCompleteValue: e.detail.valueAsString,
    });
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
});
