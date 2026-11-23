Component({
  properties: {
    open: {
      type: Boolean,
      value: false,
    },
    duration: {
      type: Number,
      value: 300,
    },
  },

  data: {
    mountedAt: "",
    keyword: "",
    onlyInStock: true,
  },

  lifetimes: {
    attached() {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      this.setData({ mountedAt: time });
      this.triggerEvent("attached", { mountedAt: time });
    },

    detached() {
      this.triggerEvent("detached");
    },
  },

  methods: {
    onKeywordChange(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
      this.setData({ keyword: e.detail?.value ?? "" });
    },

    onStockChange(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
      this.setData({ onlyInStock: Boolean(e.detail?.checked) });
    },

    handleClose() {
      this.triggerEvent("close");
    },

    handleExitComplete() {
      this.triggerEvent("exitcomplete");
    },

    handleApply() {
      this.triggerEvent("apply", {
        keyword: this.data.keyword,
        onlyInStock: this.data.onlyInStock,
      });
      this.triggerEvent("close");
    },
  },
});
