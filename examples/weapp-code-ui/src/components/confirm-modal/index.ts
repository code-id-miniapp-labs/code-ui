Component({
  properties: {
    open: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: "Confirm Action",
    },
    duration: {
      type: Number,
      value: 250,
    },
  },

  data: {
    mountedAt: "",
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
    handleClose() {
      this.triggerEvent("close");
    },

    handleExitComplete() {
      this.triggerEvent("exitcomplete");
    },

    handleConfirm() {
      this.triggerEvent("confirm");
      this.triggerEvent("close");
    },
  },
});
