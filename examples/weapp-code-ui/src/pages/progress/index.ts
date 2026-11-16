interface ProgressRef {
  setValue?: (value: number | null) => void;
  setToMin?: () => void;
  setToMax?: () => void;
  reset?: () => void;
}

Page({
  data: {
    value: 60,
    indeterminate: false,
    inverted: false,
    colors: [
      "primary",
      "secondary",
      "neutral",
      "success",
      "warning",
      "danger",
      "info",
    ] as const,
    sizes: ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"] as const,
  },

  getProgressRef(): ProgressRef | null {
    return this.selectComponent("#demo-progress") as ProgressRef | null;
  },

  increase() {
    const current = this.data.value ?? 0;
    this.setData({ value: Math.min(100, current + 10) });
  },

  decrease() {
    const current = this.data.value ?? 0;
    this.setData({ value: Math.max(0, current - 10) });
  },

  toggleIndeterminate(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ indeterminate: Boolean(e.detail?.checked) });
  },

  toggleInverted(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ inverted: Boolean(e.detail?.checked) });
  },

  callSetMin() {
    this.getProgressRef()?.setToMin?.();
    this.setData({ value: 0 });
  },

  callSetMax() {
    this.getProgressRef()?.setToMax?.();
    this.setData({ value: 100 });
  },

  callSetHalf() {
    this.getProgressRef()?.setValue?.(50);
    this.setData({ value: 50 });
  },

  callReset() {
    this.getProgressRef()?.reset?.();
    this.setData({ value: 60, indeterminate: false, inverted: false });
  },
});
