import { useComponentRef, type UseComponentRefReturn } from "@code-ui/composables";

Page({
  data: {
    // 1. Interactive Demo
    activeStep: 0,
    stepper: {} as Record<string, any>,
    linear: true,
    color: "primary",
    colorOptions: [
      "primary",
      "secondary",
      "neutral",
      "success",
      "warning",
      "danger",
      "info",
    ],
    size: "md",
    sizeOptions: ["xs", "sm", "md", "lg", "xl"],

    // 2. Data-Driven Steps
    dataStep: 0,
    stepsData: [
      {
        title: "Account",
        description: "Credentials",
        value: "account",
        icon: "i-lucide-user",
        completedIcon: "i-lucide-check",
      },
      {
        title: "Personal",
        description: "Name & contact",
        value: "personal",
        icon: "i-lucide-file-text",
        completedIcon: "i-lucide-eye",
      },
      {
        title: "Review",
        description: "Confirmation",
        value: "review",
        icon: "i-lucide-send",
        completedIcon: "i-lucide-flame",
      },
    ],

    // 3. Vertical Order Tracking
    orderStep: 2,
  },

  stepperRef: null as UseComponentRefReturn<any, any | null> | null,

  onReady() {
    this.stepperRef = useComponentRef(this, "#stepper-controlled", {
      key: "stepper",
      onChange: (snapshot) => {
        console.log(snapshot);
      },
    });
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
    this.stepperRef?.api?.nextStep?.();
  },

  prevStep() {
    this.stepperRef?.api?.prevStep?.();
  },

  resetStep() {
    this.stepperRef?.api?.resetStep?.();
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

  jumpToStepTwo() {
    this.stepperRef?.api?.setStep?.(2);
  },
});
