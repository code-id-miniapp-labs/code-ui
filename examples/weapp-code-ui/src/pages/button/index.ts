Page({
  data: {
    count: 0,
    customButtonUI: {
      root: "shadow-md ring-2 ring-emerald-400 ring-offset-2",
    },
    disabled: false,
    checked: false,
  },

  handleTap() {
    this.setData({
      count: this.data.count + 1,
    });
  },

  toggleDisabled(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      disabled: e.detail.checked,
    });
  },

  handleAsyncAction() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.setData({
          count: this.data.count + 1,
        });
        resolve();
      }, 1500);
    });
  },
  onControlledChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      checked: e.detail.checked,
    });
  },
});
