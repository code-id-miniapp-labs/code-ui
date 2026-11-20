interface FormRef {
  submit?: () => Promise<any>;
  reset?: (name?: string | string[]) => void;
  resetValidation?: (name?: string | string[]) => void;
  setErrors?: (errors: Record<string, string | string[]>) => void;
  setValues?: (values: Record<string, any>) => void;
}

Page({
  data: {
    formDisabled: false,
    validateOn: ["input", "change", "blur"] as ("input" | "change" | "blur")[],
    validateOnMode: "live" as "live" | "submit",

    usernameRules: [
      { required: true, message: "Username is required" },
      { minLength: 3, message: "Username must be at least 3 characters" },
    ],
    emailRules: [
      { required: true, message: "Email address is required" },
      { email: true, message: "Invalid email address format" },
    ],
    pinRules: [
      { required: true, message: "Security PIN is required" },
      { exactLength: 4, message: "PIN must be exactly 4 digits" },
      { numeric: true, message: "PIN must contain digits only" },
    ],
    transferPinRules: [
      { required: true, message: "Enter all 6 digits" },
      { exactLength: 6, message: "Must be 6 digits" },
    ],
    topicsRules: [
      {
        validator: (val: unknown) => {
          const arr = Array.isArray(val) ? val : [];
          return arr.length >= 1 || "Pick at least one topic of interest";
        },
      },
    ],
    roleRules: [{ required: true, message: "Please choose your workspace role" }],
    departmentRules: [
      { required: true, message: "Please select a department" },
    ],
    primaryStackRules: [
      { required: true, message: "Please select your primary tech stack" },
    ],
    countryRules: [
      { required: true, message: "Please select a country or region" },
    ],
    skillsRules: [
      {
        validator: (val: unknown) => {
          const arr = Array.isArray(val) ? val : [];
          return arr.length >= 2 || "Select at least 2 core skills";
        },
      },
    ],
    cityRules: [{ required: true, message: "Please pick an office city" }],
    frameworkRules: [
      { required: true, message: "Please select a target framework" },
    ],
    labelsRules: [
      {
        validator: (val: unknown) => {
          const arr = Array.isArray(val) ? val : [];
          return arr.length >= 2 || "Select or create at least 2 issue labels";
        },
      },
    ],
    reviewerRules: [
      { required: true, message: "Please assign a code reviewer" },
    ],
    termsRules: [
      {
        required: true,
        message: "You must accept the Terms of Service to register",
      },
    ],

    roleItems: [
      { value: "developer", label: "Developer" },
      { value: "designer", label: "Designer" },
      { value: "pm", label: "Product Manager" },
    ],
    departmentItems: [
      { value: "engineering", label: "Core Engineering" },
      { value: "design", label: "Design Systems" },
      { value: "product", label: "Product & Growth" },
    ],
    countryItems: [
      { value: "us", label: "United States" },
      { value: "jp", label: "Japan" },
      { value: "sg", label: "Singapore" },
      { value: "de", label: "Germany" },
    ],
    skillItems: [
      { value: "ts", label: "TypeScript" },
      { value: "weapp", label: "WeChat MiniProgram" },
      { value: "fsm", label: "State Machines" },
      { value: "tailwind", label: "Tailwind CSS" },
    ],
    cityItems: [
      { label: "Beijing", value: "beijing" },
      { label: "Shanghai", value: "shanghai" },
      { label: "Shenzhen", value: "shenzhen" },
      { label: "Hangzhou", value: "hangzhou" },
    ],
    topicItems: [
      { value: "components", label: "UI Components" },
      { value: "fsm", label: "State Machines" },
      { value: "theming", label: "Runtime Theming" },
    ],
    frameworkItems: [
      { value: "weapp", label: "WeChat MiniProgram" },
      { value: "nuxt", label: "Nuxt UI v4" },
      { value: "vite", label: "Weapp-Vite" },
      { value: "skyline", label: "Skyline Renderer" },
    ],
    labelItems: ["Feature", "Bugfix", "Performance", "Accessibility"],
    fieldSizes: ["xs", "sm", "md", "lg", "xl"] as const,

    newsletterControlled: true,
    formStatus: "",
    formMessage: "",
    transferStatus: "",
    transferMessage: "",
    preferencesStatus: "",
    preferencesMessage: "",
    selectFormStatus: "",
    selectFormMessage: "",
    inputMenuFormStatus: "",
    inputMenuFormMessage: "",

    // 6. Dynamic & Conditional Complex Form
    dynamicAccountType: "personal" as "personal" | "business",
    dynamicFulfillment: "delivery" as "delivery" | "pickup",
    dynamicNeedInvoice: false,
    dynamicRecipients: [{ id: 1 }] as { id: number }[],
    nextRecipientId: 2,
    dynamicFormStatus: "",
    dynamicFormMessage: "",

    accountTypeItems: [
      { value: "personal", label: "Personal" },
      { value: "business", label: "Business" },
    ],
    companySizeItems: [
      { value: "1-10", label: "1–10 employees" },
      { value: "11-50", label: "11–50 employees" },
      { value: "51-200", label: "51–200 employees" },
      { value: "200+", label: "200+ employees" },
    ],
    fulfillmentItems: [
      { value: "delivery", label: "Delivery" },
      { value: "pickup", label: "Store Pickup" },
    ],
    deliverySpeedItems: [
      { value: "standard", label: "Standard (3–5 days)" },
      { value: "express", label: "Express (Next day)" },
    ],
    pickupStoreItems: [
      { value: "jakarta", label: "Jakarta Flagship" },
      { value: "bandung", label: "Bandung Hub" },
      { value: "surabaya", label: "Surabaya Center" },
    ],

    accountTypeRules: [{ required: true, message: "Select an account type" }],
    fullNameRules: [
      { required: true, message: "Full name is required" },
      { minLength: 2, message: "Enter at least 2 characters" },
    ],
    companyNameRules: [
      { required: true, message: "Company name is required" },
    ],
    taxIdRules: [
      { required: true, message: "Tax ID is required for business accounts" },
      { minLength: 10, message: "Tax ID must be at least 10 characters" },
    ],
    companySizeRules: [{ required: true, message: "Select company size" }],
    fulfillmentRules: [
      { required: true, message: "Select a fulfillment method" },
    ],
    shippingAddressRules: [
      { required: true, message: "Shipping address is required" },
      { minLength: 10, message: "Please provide a complete address (min 10 chars)" },
    ],
    deliverySpeedRules: [
      { required: true, message: "Choose a delivery priority" },
    ],
    pickupStoreRules: [{ required: true, message: "Choose a pickup location" }],
  },

  getRegistrationForm(): FormRef | null {
    return this.selectComponent("#registration-form") as FormRef | null;
  },

  getTransferForm(): FormRef | null {
    return this.selectComponent("#transfer-form") as FormRef | null;
  },

  getPreferencesForm(): FormRef | null {
    return this.selectComponent("#preferences-form") as FormRef | null;
  },

  getSelectForm(): FormRef | null {
    return this.selectComponent("#select-form") as FormRef | null;
  },

  getInputMenuForm(): FormRef | null {
    return this.selectComponent("#input-menu-form") as FormRef | null;
  },

  toggleFormDisabled(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ formDisabled: Boolean(e.detail?.checked) });
  },

  toggleValidateOn(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset?.mode as "live" | "submit" | undefined;
    if (!mode) return;
    this.setData({
      validateOnMode: mode,
      validateOn: mode === "live" ? ["input", "change", "blur"] : [],
    });
  },

  submitRegistration() {
    this.getRegistrationForm()?.submit?.();
  },

  resetRegistration() {
    this.getRegistrationForm()?.reset?.();
    this.setData({
      newsletterControlled: true,
      formStatus: "",
      formMessage: "",
    });
  },

  onNewsletterChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ newsletterControlled: Boolean(e.detail?.checked) });
  },

  toggleNewsletterControlled() {
    this.setData({ newsletterControlled: !this.data.newsletterControlled });
  },

  clearRegistrationErrors() {
    this.getRegistrationForm()?.resetValidation?.();
    this.setData({ formStatus: "", formMessage: "" });
  },

  setPredefined() {
    this.getRegistrationForm()?.setValues?.({
      username: "alice_w",
      email: "alice@example.com",
      pin: "2026",
      role: "developer",
      department: "engineering",
      primaryStack: "ts",
      topics: ["components", "theming"],
      satisfaction: 85,
      terms: true,
      newsletter: true,
    });
    this.setData({
      newsletterControlled: true,
      formStatus: "Info",
      formMessage: "Pre-filled all form fields with valid data.",
    });
  },

  simulateServerError() {
    this.getRegistrationForm()?.setErrors?.({
      email: "This email address is already registered",
      pin: "This PIN is too common, choose another one",
    });
    this.setData({
      formStatus: "Server Validation Error",
      formMessage: "Injected backend errors into Email & PIN fields.",
    });
  },

  handleRegistrationSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formStatus: "Success",
      formMessage: `Submitted: ${JSON.stringify(e.detail.values)}`,
    });
  },

  handleRegistrationError(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formStatus: "Validation Failed",
      formMessage: `Errors in: ${Object.keys(e.detail.errorBag || {}).join(", ")}.`,
    });
  },

  submitTransfer() {
    this.getTransferForm()?.submit?.();
  },

  resetTransfer() {
    this.getTransferForm()?.reset?.();
    this.setData({ transferStatus: "", transferMessage: "" });
  },

  handleTransferSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      transferStatus: "Success",
      transferMessage: `Authorized with PIN: ${e.detail.values?.transferPin}`,
    });
  },

  handleTransferError() {
    this.setData({
      transferStatus: "Error",
      transferMessage: "Please enter all 6 digits.",
    });
  },

  submitPreferences() {
    this.getPreferencesForm()?.submit?.();
  },

  resetPreferences() {
    this.getPreferencesForm()?.reset?.();
    this.setData({ preferencesStatus: "", preferencesMessage: "" });
  },

  setHighSecurityPreferences() {
    this.getPreferencesForm()?.setValues?.({
      notifications: true,
      biometrics: true,
      twoFactor: true,
      marketing: false,
    });
    this.setData({
      preferencesStatus: "Info",
      preferencesMessage: "Applied recommended high security profile.",
    });
  },

  handlePreferencesSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      preferencesStatus: "Saved",
      preferencesMessage: `Preferences: ${JSON.stringify(e.detail.values)}`,
    });
  },

  submitSelectForm() {
    this.getSelectForm()?.submit?.();
  },

  fillSelectForm() {
    this.getSelectForm()?.setValues?.({
      country: "jp",
      skills: ["ts", "weapp"],
      city: "shanghai",
    });
    this.setData({
      selectFormStatus: "Info",
      selectFormMessage: "Filled single, multi, and picker select fields.",
    });
  },

  injectSelectFormErrors() {
    this.getSelectForm()?.setErrors?.({
      country: "Selected region is currently unavailable",
      skills: "Choose a different combination of core skills",
    });
    this.setData({
      selectFormStatus: "Server Validation Error",
      selectFormMessage: "Injected backend errors into Country & Skills.",
    });
  },

  clearSelectFormErrors() {
    this.getSelectForm()?.resetValidation?.();
    this.setData({ selectFormStatus: "", selectFormMessage: "" });
  },

  resetSelectForm() {
    this.getSelectForm()?.reset?.();
    this.setData({ selectFormStatus: "", selectFormMessage: "" });
  },

  handleSelectFormSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      selectFormStatus: "Success",
      selectFormMessage: `Submitted: ${JSON.stringify(e.detail.values)}`,
    });
  },

  handleSelectFormError(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      selectFormStatus: "Validation Failed",
      selectFormMessage: `Errors in: ${Object.keys(e.detail.errorBag || {}).join(", ")}.`,
    });
  },

  onCreateFormLabel(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const newLabel = e.detail?.value?.trim();
    if (!newLabel) return;
    if (!this.data.labelItems.includes(newLabel)) {
      this.setData({
        labelItems: [...this.data.labelItems, newLabel],
      });
    }
    const inputMenu = this.selectComponent("#input-menu-labels") as {
      selectValue?: (val: string) => void;
    } | null;
    inputMenu?.selectValue?.(newLabel);
  },

  submitInputMenuForm() {
    this.getInputMenuForm()?.submit?.();
  },

  fillInputMenuForm() {
    this.getInputMenuForm()?.setValues?.({
      framework: "weapp",
      labels: ["Feature", "Performance"],
      reviewer: "alice",
    });
    this.setData({
      inputMenuFormStatus: "Info",
      inputMenuFormMessage:
        "Filled single, multi-tag, and custom item InputMenu fields.",
    });
  },

  injectInputMenuFormErrors() {
    this.getInputMenuForm()?.setErrors?.({
      framework: "Selected framework version is deprecated",
      labels: "Please include at least one priority label",
      reviewer: "Alice is currently on vacation",
    });
    this.setData({
      inputMenuFormStatus: "Server Validation Error",
      inputMenuFormMessage:
        "Injected backend errors into Framework, Labels & Reviewer.",
    });
  },

  clearInputMenuFormErrors() {
    this.getInputMenuForm()?.resetValidation?.();
    this.setData({ inputMenuFormStatus: "", inputMenuFormMessage: "" });
  },

  resetInputMenuForm() {
    this.getInputMenuForm()?.reset?.();
    this.setData({ inputMenuFormStatus: "", inputMenuFormMessage: "" });
  },

  handleInputMenuFormSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      inputMenuFormStatus: "Success",
      inputMenuFormMessage: `Submitted: ${JSON.stringify(e.detail.values)}`,
    });
  },

  handleInputMenuFormError(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      inputMenuFormStatus: "Validation Failed",
      inputMenuFormMessage: `Errors in: ${Object.keys(e.detail.errorBag || {}).join(", ")}.`,
    });
  },

  // 6. Dynamic & Conditional Complex Form handlers
  getDynamicForm(): FormRef | null {
    return this.selectComponent("#dynamic-form") as FormRef | null;
  },

  onDynamicAccountTypeChange(
    e: WechatMiniprogram.CustomEvent<{ value?: "personal" | "business" }>,
  ) {
    const next = e.detail?.value;
    if (!next) return;
    this.setData({ dynamicAccountType: next });
  },

  onDynamicFulfillmentChange(
    e: WechatMiniprogram.CustomEvent<{ value?: "delivery" | "pickup" }>,
  ) {
    const next = e.detail?.value;
    if (!next) return;
    this.setData({ dynamicFulfillment: next });
  },

  onDynamicInvoiceChange(
    e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>,
  ) {
    this.setData({ dynamicNeedInvoice: Boolean(e.detail?.checked) });
  },

  addDynamicRecipient() {
    if (this.data.dynamicRecipients.length >= 3) return;
    const id = this.data.nextRecipientId;
    this.setData({
      dynamicRecipients: [...this.data.dynamicRecipients, { id }],
      nextRecipientId: id + 1,
    });
  },

  removeDynamicRecipient(e: WechatMiniprogram.TouchEvent) {
    const id = Number(e.currentTarget.dataset?.id);
    this.setData({
      dynamicRecipients: this.data.dynamicRecipients.filter((r) => r.id !== id),
    });
  },

  resetDynamicForm() {
    this.getDynamicForm()?.reset?.();
    this.setData({
      dynamicAccountType: "personal",
      dynamicFulfillment: "delivery",
      dynamicNeedInvoice: false,
      dynamicRecipients: [{ id: 1 }],
      nextRecipientId: 2,
      dynamicFormStatus: "",
      dynamicFormMessage: "",
    });
  },

  handleDynamicFormSubmit(e: WechatMiniprogram.CustomEvent) {
    const values = e.detail?.values;
    const fakeRequest = new Promise<void>((resolve) => {
      setTimeout(() => {
        this.setData({
          dynamicFormStatus: "Success",
          dynamicFormMessage: `Submitted: ${JSON.stringify(values)}`,
        });
        resolve();
      }, 1000);
    });
    e.detail?.setPromise?.(fakeRequest);
  },

  handleDynamicFormError(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      dynamicFormStatus: "Validation Failed",
      dynamicFormMessage: `Errors in: ${Object.keys(e.detail.errorBag || {}).join(", ")}.`,
    });
  },
});
