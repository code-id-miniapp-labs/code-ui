Page({
  data: {
    // 1. Interactive Demo
    activeStep: 0,
    linear: true,
    color: "primary",
    colorOptions: [
      "primary",
      "neutral",
      "success",
      "warning",
      "danger",
      "info",
    ],
    size: "md",
    sizeOptions: ["xs", "sm", "md", "lg"],

    // 2. Data-Driven Steps
    dataStep: 0,
    stepsData: [
      {
        title: "Account",
        description: "Credentials",
        value: "account",
      },
      {
        title: "Personal",
        description: "Name & contact",
        value: "personal",
      },
      {
        title: "Review",
        description: "Confirmation",
        value: "review",
      },
    ],

    // 3. Vertical Order Tracking
    orderStep: 2,
  },

  onStepChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      activeStep: e.detail.step,
    });
  },

  onDataStepChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      dataStep: e.detail.step,
    });
  },

  onOrderStepChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      orderStep: e.detail.step,
    });
  },

  nextStep() {
    if (this.data.activeStep < 4) {
      this.setData({
        activeStep: this.data.activeStep + 1,
      });
    }
  },

  prevStep() {
    if (this.data.activeStep > 0) {
      console.log(this.data.activeStep);
      this.setData({
        activeStep: this.data.activeStep - 1,
      });
    }
  },

  resetStep() {
    this.setData({
      activeStep: 0,
    });
  },

  toggleLinear(e: WechatMiniprogram.CustomEvent) {
    const checked = e.detail?.value ?? e.detail?.checked ?? !this.data.linear;
    this.setData({
      linear: Boolean(checked),
    });
  },

  selectColor(e: WechatMiniprogram.CustomEvent) {
    const color = e.currentTarget.dataset.color;
    if (color) this.setData({ color });
  },

  selectSize(e: WechatMiniprogram.CustomEvent) {
    const size = e.currentTarget.dataset.size;
    if (size) this.setData({ size });
  },
});
