Page({
  data: {
    value: 60,
    colors: ["primary", "neutral", "success", "warning", "danger", "info"] as const,
    sizes: ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"] as const,
  },

  increase() {
    const current = this.data.value ?? 0;
    this.setData({
      value: Math.min(100, current + 10),
    });
  },

  decrease() {
    const current = this.data.value ?? 0;
    this.setData({
      value: Math.max(0, current - 10),
    });
  },

  toggleIndeterminate() {
    this.setData({
      value: this.data.value === null ? 60 : null,
    });
  },
});

