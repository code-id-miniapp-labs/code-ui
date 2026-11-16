Page({
  data: {
    variants: ["solid", "outline", "soft", "subtle"] as const,
    colors: [
      "primary",
      "secondary",
      "neutral",
      "success",
      "warning",
      "danger",
      "info",
    ] as const,
    sizes: ["xs", "sm", "md", "lg", "xl"] as const,
    unreadCount: 4,
    activeFilter: "all",
  },

  onBumpCount() {
    this.setData({ unreadCount: this.data.unreadCount + 1 });
  },

  onClearCount() {
    this.setData({ unreadCount: 0 });
  },

  onSelectFilter(e: WechatMiniprogram.TouchEvent) {
    const filter = e.currentTarget.dataset?.filter as string | undefined;
    if (filter) {
      this.setData({ activeFilter: filter });
    }
  },
});
