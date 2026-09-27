Page({
  data: {
    drawerOpen: false,
    drawerPlacement: "bottom",
    count: 0,
    customButtonUI: {
      root: "shadow-md ring-2 ring-emerald-400 ring-offset-2",
    },
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
