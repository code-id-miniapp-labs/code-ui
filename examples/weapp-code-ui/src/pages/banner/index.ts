Page({
  data: {
    showTopBanner: true,
    topBannerColor: "primary",
    topBannerTitle: "Banner 1",
    topBannerDesc: "Testing Banner",

    showBottomBanner: false,
    bottomBannerColor: "primary",
    bottomBannerTitle: "New Version Available",
    bottomBannerDesc: "Version 2.4.0 is now available.",

    isLoading: true,
    activeTab: 0,
    lastEvent: "Page loaded. Fixed top banner active below custom top-bar.",

    topBannerActions: [
      {
        label: "Details",
        size: "xs",
        closeOnClick: false,
        onClick: () => {
          console.log("mabarin king");
        },
      },
    ],

    bottomBannerActions: [{ label: "Update", size: "xs", closeOnClick: true }],

    pinCodeActions: [
      {
        label: "Read more",
        closeOnClick: false,
        onClick: () => {},
      },
      {
        label: "Set Pincode",
        closeOnClick: true,

        onClick: () => {
          console.log("mabarin king");
        },
      },
    ],

    // Promo offer multiple actions
    promoActions: [
      { label: "Claim Voucher", closeOnClick: false },
      { label: "View Terms", closeOnClick: false },
    ],

    // Security alert multiple actions
    securityActions: [
      { label: "Review Devices", closeOnClick: false },
      { label: "Lock Account", closeOnClick: true },
    ],

    // Music playlist multiple actions
    musicActions: [
      { label: "Play Now", closeOnClick: false },
      { label: "View Album", closeOnClick: false },
    ],
  },

  handleBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.reLaunch({ url: "/pages/index/index" });
    }
  },

  toggleTopBanner() {
    this.setData({
      showTopBanner: !this.data.showTopBanner,
      lastEvent: !this.data.showTopBanner
        ? "Toggled fixed top banner: OPEN"
        : "Toggled fixed top banner: CLOSED",
    });
  },

  setTopBannerColor(e: WechatMiniprogram.CustomEvent) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      showTopBanner: true,
      topBannerColor: color,
      lastEvent: `Set fixed top banner color: ${color}`,
    });
  },

  toggleBottomBanner() {
    this.setData({
      showBottomBanner: !this.data.showBottomBanner,
      lastEvent: !this.data.showBottomBanner
        ? "Toggled fixed bottom banner: OPEN"
        : "Toggled fixed bottom banner: CLOSED",
    });
  },

  setBottomBannerColor(e: WechatMiniprogram.CustomEvent) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      showBottomBanner: true,
      bottomBannerColor: color,
      lastEvent: `Set fixed bottom banner color: ${color}`,
    });
  },

  toggleLoading() {
    this.setData({
      isLoading: !this.data.isLoading,
      lastEvent: `Toggled banner loading state: ${!this.data.isLoading}`,
    });
  },

  switchTab(e: WechatMiniprogram.CustomEvent) {
    const tab = Number(e.currentTarget.dataset.tab);
    this.setData({
      activeTab: tab,
      lastEvent: `Switched custom tab-bar tab to: index ${tab}`,
    });
  },

  onTopBannerDismiss() {
    this.setData({
      showTopBanner: false,
      lastEvent:
        "Fixed top banner dismissed by user (close button). Layout padding retracted.",
    });
  },

  onTopBannerAction(e: WechatMiniprogram.CustomEvent) {
    const { action, index } = e.detail;
    this.setData({
      lastEvent: `Top banner action clicked: "${action.label}" (index ${index})`,
    });
  },

  onBottomBannerDismiss() {
    this.setData({
      showBottomBanner: false,
      lastEvent:
        "Fixed bottom banner dismissed by user (close button). Layout padding retracted.",
    });
  },

  onBottomBannerAction(e: WechatMiniprogram.CustomEvent) {
    const { action, index } = e.detail;
    this.setData({
      lastEvent: `Bottom banner action clicked: "${action.label}" (index ${index})`,
    });
  },

  onInlineAction(e: WechatMiniprogram.CustomEvent) {
    const { action } = e.detail;
    this.setData({
      lastEvent: `Inline banner action clicked: "${action.label}"`,
    });
  },

  onInlineMore() {
    this.setData({
      lastEvent: "Inline banner more button clicked.",
    });
  },

  onPinCodeAction(e: WechatMiniprogram.CustomEvent) {
    const { action, index } = e.detail;
    this.setData({
      lastEvent: `Pin Code Banner Action: "${action.label}" (index ${index})`,
    });
  },

  onPromoAction(e: WechatMiniprogram.CustomEvent) {
    const { action, index } = e.detail;
    this.setData({
      lastEvent: `Promo Offer Banner Action: "${action.label}" (index ${index})`,
    });
  },

  onSecurityAction(e: WechatMiniprogram.CustomEvent) {
    const { action, index } = e.detail;
    this.setData({
      lastEvent: `Security Alert Action: "${action.label}" (index ${index})`,
    });
  },

  onMusicAction(e: WechatMiniprogram.CustomEvent) {
    const { action, index } = e.detail;
    this.setData({
      lastEvent: `Music Banner Action: "${action.label}" (index ${index})`,
    });
  },
});
