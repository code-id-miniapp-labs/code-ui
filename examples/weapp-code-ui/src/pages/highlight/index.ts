Page({
  data: {
    searchQuery: "payment",
    ignoreCase: true,
    matchAll: true,
    exactMatch: false,
    multiQueries: ["spotlight", "emphasize", "keywords"],
    searchItems: [
      {
        id: 1,
        title: "Instant Payment Confirmation",
        desc: "Receive real-time payment alerts whenever a direct debit payment completes.",
      },
      {
        id: 2,
        title: "Scheduled Payment Reminders",
        desc: "Configure automated payment reminders 3 days before your billing date.",
      },
      {
        id: 3,
        title: "Daily Transaction Limit",
        desc: "Adjust your maximum daily payment threshold inside security settings.",
      },
    ],
  },

  onSearchInput(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({ searchQuery: e.detail?.value ?? "" });
  },

  onSearchClear() {
    this.setData({ searchQuery: "" });
  },

  onIgnoreCaseChange(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ ignoreCase: Boolean(e.detail?.checked) });
  },

  onMatchAllChange(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ matchAll: Boolean(e.detail?.checked) });
  },

  onExactMatchChange(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ exactMatch: Boolean(e.detail?.checked) });
  },
});
