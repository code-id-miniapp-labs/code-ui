interface FormRef {
  submit?: () => Promise<any>;
  reset?: (name?: string | string[]) => void;
  resetValidation?: (name?: string | string[]) => void;
  setErrors?: (errors: Record<string, string | string[]>) => void;
  setValues?: (values: Record<string, any>) => void;
}

Page({
  data: {
    singleValue: 35,
    rangeValue: [20, 80],
    stepValue: 40,
    marks: [
      { value: 0, label: "0°C" },
      { value: 25, label: "25°C" },
      { value: 50, label: "50°C" },
      { value: 75, label: "75°C" },
      { value: 100, label: "100°C" },
    ],
    lastEvent: "None",

    // Form showcase state
    formBudgetValue: 25,
    formStatus: "",
    formMessage: "",
    budgetRules: [
      { required: true, message: "Campaign budget is required" },
      { min: 40, message: "Minimum budget must be at least $40" },
    ],
  },

  onSingleChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      singleValue: e.detail.value,
      lastEvent: `single change: ${e.detail.value}`,
    });
  },

  onRangeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      rangeValue: e.detail.value,
      lastEvent: `range change: [${e.detail.values.join(", ")}]`,
    });
  },

  setSingleTo70() {
    this.setData({
      singleValue: 70,
    });
  },

  onFormBudgetChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formBudgetValue: e.detail.value,
    });
  },

  setFormBudgetTo80() {
    this.setData({
      formBudgetValue: 80,
    });
  },

  getSliderForm(): FormRef | null {
    return this.selectComponent("#slider-demo-form") as FormRef | null;
  },

  submitSliderForm() {
    this.getSliderForm()?.submit?.();
  },

  resetSliderForm() {
    this.getSliderForm()?.reset?.();
    this.setData({
      formBudgetValue: 25,
      formStatus: "",
      formMessage: "",
    });
  },

  handleFormSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formStatus: "Success",
      formMessage: `Form submitted with values: ${JSON.stringify(e.detail.values)}`,
    });
  },

  handleFormError(e: WechatMiniprogram.CustomEvent) {
    const errorBag = (e.detail?.errorBag || {}) as Record<string, string>;
    const firstField = Object.keys(errorBag)[0];
    const firstMsg = firstField ? errorBag[firstField] : "Validation failed";
    this.setData({
      formStatus: "Validation Error",
      formMessage: `${firstField}: ${firstMsg}`,
    });
  },
});
