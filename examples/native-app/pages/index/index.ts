/// <reference types="miniprogram-api-typings" />

export type Placement = "bottom" | "top" | "left" | "right";

export interface IndexPageData {
  isDrawerOpen: boolean;
  placement: Placement;
  threshold: number;
  closeOnBackdrop: boolean;
  dismissible: boolean;
  placements: Placement[];
  isLoadingBtn: boolean;
}

export interface IndexPageCustom {
  handleButtonTap: (
    e: WechatMiniprogram.CustomEvent<{ variant?: string }>,
  ) => void;
  handleAsyncAction: () => Promise<void>;
  handleSelectPlacement: (e: WechatMiniprogram.CustomEvent) => void;
  handleSelectThreshold: (e: WechatMiniprogram.CustomEvent) => void;
  handleToggleBackdrop: (
    e: WechatMiniprogram.CustomEvent<{ value: boolean }>,
  ) => void;
  handleToggleDismissible: (
    e: WechatMiniprogram.CustomEvent<{ value: boolean }>,
  ) => void;
  handleOpenDrawer: () => void;
  handleDrawerClose: () => void;
}

Page<IndexPageData, IndexPageCustom>({
  data: {
    isDrawerOpen: false,
    placement: "bottom",
    threshold: 80,
    closeOnBackdrop: true,
    isLoadingBtn: false,
    dismissible: true,
    placements: ["bottom", "top", "left", "right"],
  },

  handleButtonTap(e) {
    const variant = e.currentTarget.dataset.variant || "button";
    wx.showToast({
      title: `${variant} tapped`,
      icon: "none",
      duration: 1200,
    });
  },

  handleAsyncAction() {
    this.setData({
      isLoadingBtn: true,
    });
    return new Promise((resolve) => {
      setTimeout(() => {
        wx.showToast({
          title: "Async action resolved!",
          icon: "success",
          duration: 1500,
        });
        resolve();
        this.setData({
          isLoadingBtn: false,
        });
      }, 2000);
    });
  },

  handleSelectPlacement(e) {
    const placement = e.currentTarget.dataset.placement as Placement;
    this.setData({
      placement,
      isDrawerOpen: true,
    });
  },

  handleSelectThreshold(e) {
    const threshold = Number(e.currentTarget.dataset.threshold);
    this.setData({ threshold });
  },

  handleToggleBackdrop(e) {
    this.setData({ closeOnBackdrop: e.detail.value });
  },

  handleToggleDismissible(e) {
    this.setData({ dismissible: e.detail.value });
  },

  handleOpenDrawer() {
    this.setData({ isDrawerOpen: true });
  },

  handleDrawerClose() {
    this.setData({ isDrawerOpen: false });
  },
});
