import { useToast } from "@code-ui/composables";

Page({
  data: {
    count: 0,
    disabled: false,
    asyncResult: "Tap either async button to test loadingAuto.",
    variants: ["solid", "outline", "soft", "ghost", "secondary"] as const,
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
    customButtonUI: {
      root: "shadow-md ring-2 ring-primary/40 ring-offset-2",
    },
  },

  toggleDisabled(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({
      disabled: Boolean(e.detail?.checked),
    });
  },

  handleCountTap() {
    this.setData({ count: this.data.count + 1 });
  },

  handleAsyncResolve() {
    this.setData({ asyncResult: "Running async resolve..." });
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.setData({
          count: this.data.count + 1,
          asyncResult: "Resolved cleanly after 1.2s (auto-reset done).",
        });
        resolve();
      }, 1200);
    });
  },

  handleAsyncReject() {
    this.setData({ asyncResult: "Running async reject..." });
    return new Promise<void>((_, reject) => {
      setTimeout(() => {
        this.setData({
          asyncResult: "Rejected after 1.2s (spinner stopped safely).",
        });
        reject(new Error("Simulated network error"));
      }, 1200);
    }).catch(() => {
      // Handled gracefully for demo
    });
  },

  onOpenSetting() {
    useToast(this).info("Returned from WeChat Open Setting");
  },

  onShareAppMessage() {
    return {
      title: "Code UI — MiniProgram Component Library",
      path: "/pages/index/index",
    };
  },
});
