Page({
  data: {
    controlledOpen: false,
    lastAction: "",
  },

  toggleControlled() {
    this.setData({ controlledOpen: !this.data.controlledOpen });
  },

  closeControlled() {
    this.setData({ controlledOpen: false });
  },

  handleOpenChange(e: WechatMiniprogram.CustomEvent<{ open: boolean }>) {
    this.setData({ controlledOpen: e.detail.open });
  },

  handleItemTap(e: WechatMiniprogram.TouchEvent) {
    const action = e.currentTarget.dataset.action as string;
    this.setData({ lastAction: action });
    wx.showToast({ title: action, icon: "none" });
  },
});
