interface FormRef {
  submit?: () => Promise<any>;
  reset?: (name?: string | string[]) => void;
  resetValidation?: (name?: string | string[]) => void;
  setErrors?: (errors: Record<string, string | string[]>) => void;
  setValues?: (values: Record<string, any>) => void;
}

Page({
  data: {
    controlledValue: "",
    lineCount: 1,
    lastEvent: "none",

    titleRules: [
      { required: true, message: "Feedback title is required" },
      { minLength: 3, message: "Title must be at least 3 characters" },
    ],

    descriptionRules: [
      { required: true, message: "Description is required" },
      { minLength: 10, message: "Description must be at least 10 characters" },
    ],

    formStatus: "",
    formMessage: "",
  },

  onControlledChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const val = e.detail.value ?? "";
    this.setData({
      controlledValue: val,
      lastEvent: `change (value length: ${val.length})`,
    });
  },

  onTextareaFocus() {
    this.setData({
      lastEvent: "focus",
    });
  },

  onTextareaBlur() {
    this.setData({
      lastEvent: "blur",
    });
  },

  onLineChange(e: WechatMiniprogram.CustomEvent<{ lineCount: number }>) {
    console.log(e);
    this.setData({
      lineCount: e.detail.lineCount,
      lastEvent: `linechange (lines: ${e.detail.lineCount})`,
    });
  },

  setControlledPreset() {
    const text =
      "Open-source contributor.\nPassionate about accessible UI components and reactive state machines.";
    this.setData({
      controlledValue: text,
      lineCount: text.split("\n").length,
      lastEvent: "setPreset (programmatic)",
    });
  },

  appendControlledLine() {
    const base = this.data.controlledValue;
    const next = base
      ? `${base}\n• New appended item at ${new Date().toLocaleTimeString()}`
      : `• New item at ${new Date().toLocaleTimeString()}`;
    this.setData({
      controlledValue: next,
      lineCount: next.split("\n").length,
      lastEvent: "appendLine (programmatic)",
    });
  },

  clearControlled() {
    this.setData({
      controlledValue: "",
      lineCount: 1,
      lastEvent: "clear (programmatic)",
    });
  },

  getFeedbackForm(): FormRef | null {
    return this.selectComponent("#feedback-form") as FormRef | null;
  },

  submitForm() {
    this.getFeedbackForm()?.submit?.();
  },

  resetForm() {
    this.getFeedbackForm()?.reset?.();
    this.setData({
      formStatus: "",
      formMessage: "",
    });
  },

  prefillForm() {
    this.getFeedbackForm()?.setValues?.({
      title: "Add auto-resize showcase",
      description:
        "Textarea component works smoothly with autoHeight and character counter in WeChat MiniProgram.",
    });
    this.setData({
      formStatus: "success",
      formMessage: "Pre-filled with valid data.",
    });
  },

  injectServerError() {
    this.getFeedbackForm()?.setErrors?.({
      description: "Server rejected: description cannot contain external URLs.",
    });
    this.setData({
      formStatus: "error",
      formMessage: "Simulated backend error injected into 'description' field.",
    });
  },

  handleFormSubmit(
    e: WechatMiniprogram.CustomEvent<{ values: Record<string, any> }>,
  ) {
    this.setData({
      formStatus: "success",
      formMessage: JSON.stringify(e.detail.values, null, 2),
    });
  },

  handleFormError(
    e: WechatMiniprogram.CustomEvent<{ errors: Record<string, any> }>,
  ) {
    this.setData({
      formStatus: "error",
      formMessage: JSON.stringify(e.detail.errors, null, 2),
    });
  },
});
