interface PullDownRefreshRef {
  refresh?: () => void;
  close?: () => void;
}

function formatNow(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function buildItems(batch: number, updatedAt: string) {
  return Array.from({ length: 16 }, (_, index) => ({
    id: index + 1,
    title: `Feed Item #${index + 1}`,
    description: `Batch #${batch} · synced at ${updatedAt}`,
  }));
}

Page({
  data: {
    batch: 1,
    lastRefreshedAt: "Initial",
    disabled: false,
    useCustomIndicatorSlot: false,
    loadingIcon: "i-lucide-refresh-cw",
    threshold: 50,
    maxPullDistance: 80,
    successDuration: 600,
    loadingTexts: [
      "Pull down to refresh feed",
      "Release to sync now",
      "Fetching latest updates...",
      "Feed is up to date",
    ],
    items: buildItems(1, "Initial"),
  },

  onRefresh() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const nextBatch = this.data.batch + 1;
        const now = formatNow();
        this.setData({
          batch: nextBatch,
          lastRefreshedAt: now,
          items: buildItems(nextBatch, now),
        });
        resolve();
      }, 1200);
    });
  },

  triggerRefresh() {
    const pdr = this.selectComponent("#demo-pdr") as PullDownRefreshRef | null;
    pdr?.refresh?.();
  },

  triggerClose() {
    const pdr = this.selectComponent("#demo-pdr") as PullDownRefreshRef | null;
    pdr?.close?.();
  },

  onToggleDisabled(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ disabled: Boolean(e.detail?.checked) });
  },

  onToggleIndicatorSlot(
    e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>,
  ) {
    this.setData({ useCustomIndicatorSlot: Boolean(e.detail?.checked) });
  },
});
