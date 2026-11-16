Page({
  data: {
    loading: true,
    variant: "pulse" as "pulse" | "shine" | "none",
    variants: ["pulse", "shine", "none"] as const,
  },

  onToggleLoading(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ loading: Boolean(e.detail?.checked) });
  },

  onSelectVariant(e: WechatMiniprogram.TouchEvent) {
    const variant = e.currentTarget.dataset?.variant as
      | "pulse"
      | "shine"
      | "none"
      | undefined;
    if (variant) {
      this.setData({ variant });
    }
  },
});
