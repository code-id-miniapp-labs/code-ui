Page({
  data: {
    drawerOpen: false,
    placement: "bottom",
  },

  openDrawer(e: WechatMiniprogram.CustomEvent) {
    const placement = e.currentTarget.dataset.placement || "bottom";
    this.setData({
      drawerOpen: true,
      placement,
    });
  },

  closeDrawer() {
    this.setData({
      drawerOpen: false,
    });
  },

  onDrawerClose() {
    this.setData({
      drawerOpen: false,
    });
  },
});
