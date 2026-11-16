Page({
  data: {
    showUnread: true,
    unreadCount: 5,
    sizes: ["xs", "sm", "md", "lg", "xl"] as const,
    colors: [
      "primary",
      "secondary",
      "neutral",
      "success",
      "warning",
      "danger",
      "info",
    ] as const,
    positions: [
      "top-right",
      "bottom-right",
      "top-left",
      "bottom-left",
    ] as const,
  },

  toggleShow(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ showUnread: Boolean(e.detail?.checked) });
  },

  bumpCount() {
    this.setData({ unreadCount: this.data.unreadCount + 1, showUnread: true });
  },
});
