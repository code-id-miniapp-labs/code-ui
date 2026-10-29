Page({
  onReady() {
    console.log(
      "[Drawer] onReady - initial drawerOpen:",
      this.data.drawerOpen,
      "cuiPageStyle:",
      this.data.cuiPageStyle,
    );
  },
  data: {
    drawerOpen: false,
    placement: "bottom" as "bottom" | "top" | "left" | "right",
    lockScroll: true,
    shouldScaleBackground: true,
    scaleBackground: "bg-black",
    scaleFactor: 0.95,
    closeOnBackdropClick: true,
    scenario: "standard", // "standard" | "scrollable" | "modal"
    drawerTitle: "Bottom Sheet",
    drawerDescription: "Gesture-driven modal drawer with backdrop dimming.",

    // Mock items for nested scroll demonstration
    scrollItems: Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      title: `Drawer Item #${i + 1}`,
      desc: `Detailed content description for scroll item ${i + 1}`,
    })),

    // Background list for testing page scroll lock
    pageItems: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      title: `Page Section #${i + 1}`,
      desc: "Scroll down and open the drawer to test that background page scrolling is locked.",
    })),
  },

  openPlacement(e: WechatMiniprogram.CustomEvent) {
    const placement = (e.currentTarget.dataset.placement || "bottom") as
      | "bottom"
      | "top"
      | "left"
      | "right";
    const titles: Record<string, string> = {
      bottom: "Bottom Sheet",
      top: "Top Notification",
      left: "Navigation Drawer",
      right: "Filter & Settings",
    };
    this.setData(
      {
        placement,
        scenario: "standard",
        drawerTitle: titles[placement] || "Drawer",
        drawerDescription: `Opened with placement="${placement}". Drag or tap close to dismiss.`,
        drawerOpen: true,
      },
      () => {
        console.log(
          "[Drawer] Opened - drawerOpen:",
          this.data.drawerOpen,
          "cuiPageStyle:",
          this.data.cuiPageStyle,
        );
      },
    );
  },

  openScrollable() {
    this.setData(
      {
        placement: "bottom",
        scenario: "scrollable",
        drawerTitle: "Scrollable Content",
        drawerDescription:
          "Smooth inner scrolling while background page scrolling remains locked.",
        drawerOpen: true,
      },
      () => {
        console.log(
          "[Drawer] Opened - drawerOpen:",
          this.data.drawerOpen,
          "cuiPageStyle:",
          this.data.cuiPageStyle,
        );
      },
    );
  },

  openModal() {
    this.setData(
      {
        placement: "bottom",
        scenario: "modal",
        drawerTitle: "Confirm Action",
        drawerDescription:
          "Non-dismissible by backdrop tap (closeOnBackdropClick=false).",
        closeOnBackdropClick: false,
        drawerOpen: true,
      },
      () => {
        console.log(
          "[Drawer] Opened - drawerOpen:",
          this.data.drawerOpen,
          "cuiPageStyle:",
          this.data.cuiPageStyle,
        );
      },
    );
  },

  onLockScrollChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      lockScroll: Boolean(e.detail.checked),
    });
  },

  onScaleBackgroundChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      shouldScaleBackground: Boolean(e.detail.checked),
    });
  },

  onSelectScaleColor(e: WechatMiniprogram.CustomEvent) {
    const color = e.currentTarget.dataset.color || "bg-black";
    this.setData({
      scaleBackground: color,
    });
  },

  onBackdropCloseChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      closeOnBackdropClick: Boolean(e.detail.checked),
    });
  },

  closeDrawer() {
    this.setData(
      {
        drawerOpen: false,
        closeOnBackdropClick: true,
      },
      () => {
        console.log(
          "[Drawer] Closed - drawerOpen:",
          this.data.drawerOpen,
          "cuiPageStyle:",
          this.data.cuiPageStyle,
        );
      },
    );
  },

  onDrawerClose() {
    this.setData(
      {
        drawerOpen: false,
        closeOnBackdropClick: true,
      },
      () => {
        console.log(
          "[Drawer] Closed - drawerOpen:",
          this.data.drawerOpen,
          "cuiPageStyle:",
          this.data.cuiPageStyle,
        );
      },
    );
  },

  onConfirmAction() {
    if (typeof wx !== "undefined" && wx.showToast) {
      wx.showToast({
        title: "Confirmed!",
        icon: "success",
      });
    }
    this.closeDrawer();
  },
});
