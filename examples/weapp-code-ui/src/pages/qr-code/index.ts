Page({
  data: {
    textValue: "https://code-ui.dev",
    ecc: "M" as "L" | "M" | "Q" | "H",
    eccOptions: ["L", "M", "Q", "H"],
    size: "md",
    sizeOptions: ["xs", "sm", "md", "lg", "xl"],
    color: "neutral",
    colorOptions: [
      "neutral",
      "primary",
      "success",
      "warning",
      "danger",
      "info",
    ],
    border: 0,
    overlayLogo: "https://res.wx.qq.com/a/wx_fed/assets/res/OTE0YTAw.png",
    showCustomOverlay: false,
  },

  onInputChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      textValue: e.detail.value,
    });
  },

  selectEcc(e: WechatMiniprogram.CustomEvent) {
    const ecc = e.currentTarget.dataset.ecc;
    if (ecc) {
      this.setData({ ecc });
    }
  },

  selectSize(e: WechatMiniprogram.CustomEvent) {
    const size = e.currentTarget.dataset.size;
    if (size) {
      this.setData({ size });
    }
  },

  selectColor(e: WechatMiniprogram.CustomEvent) {
    const color = e.currentTarget.dataset.color;
    if (color) {
      this.setData({ color });
    }
  },

  toggleBorder() {
    this.setData({
      border: this.data.border === 0 ? 2 : 0,
    });
  },

  toggleCustomOverlay() {
    this.setData({
      showCustomOverlay: !this.data.showCustomOverlay,
    });
  },

  setPreset(e: WechatMiniprogram.CustomEvent) {
    const preset = e.currentTarget.dataset.preset;
    if (preset) {
      this.setData({ textValue: preset });
    }
  },
});
