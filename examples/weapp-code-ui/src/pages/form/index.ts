interface FormRef {
  submit?: () => Promise<any>;
  reset?: (name?: string | string[]) => void;
  resetValidation?: (name?: string | string[]) => void;
  setErrors?: (errors: Record<string, string | string[]>) => void;
  setValues?: (values: Record<string, any>) => void;
}

Page({
  data: {
    usernameRules: [
      { required: true, message: "Username is required" },
      { minLength: 3, message: "Username must be at least 3 characters" },
    ],
    emailRules: [
      { required: true, message: "Email address is required" },
      { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email address format" },
    ],
    pinRules: [
      { required: true, message: "Security PIN is required" },
      { exactLength: 4, message: "PIN must be exactly 4 digits" },
      { numeric: true, message: "PIN must contain digits only" },
    ],
    termsRules: [
      { required: true, message: "You must accept the Terms of Service to register" },
    ],
    newsletterControlled: true,
    formStatus: "",
    formMessage: "",
    transferStatus: "",
    transferMessage: "",
    preferencesStatus: "",
    preferencesMessage: "",
  },

  getRegistrationForm(): FormRef | null {
    return this.selectComponent("#registration-form") as FormRef | null;
  },

  getTransferForm(): FormRef | null {
    return this.selectComponent("#transfer-form") as FormRef | null;
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
    this.setData({
      newsletterControlled: e.detail.checked,
    });
  },

  toggleNewsletterControlled() {
    this.setData({
      newsletterControlled: !this.data.newsletterControlled,
    });
  },

  clearRegistrationErrors() {
    this.getRegistrationForm()?.resetValidation?.();
    this.setData({
      formStatus: "",
      formMessage: "",
    });
  },

  setPredefined() {
    this.getRegistrationForm()?.setValues?.({
      username: "alice_w",
      email: "alice@example.com",
      pin: "2026",
      terms: true,
      newsletter: true,
    });
    this.setData({
      newsletterControlled: true,
      formStatus: "Info",
      formMessage: "Pre-filled with valid data including accepted terms.",
    });
  },

  simulateServerError() {
    this.getRegistrationForm()?.setErrors?.({
      email: "This email address is already taken by another account",
      pin: "This PIN is too common, choose another one",
    });
    this.setData({
      formStatus: "Server Validation Error",
      formMessage: "Injected backend error bag into fields.",
    });
  },

  handleRegistrationSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formStatus: "Success",
      formMessage: `Submitted valid data: ${JSON.stringify(e.detail.values)}`,
    });
  },

  handleRegistrationError(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formStatus: "Validation Failed",
      formMessage: `Errors detected in ${Object.keys(e.detail.errorBag || {}).join(", ")}.`,
    });
  },

  submitTransfer() {
    this.getTransferForm()?.submit?.();
  },

  resetTransfer() {
    this.getTransferForm()?.reset?.();
    this.setData({
      transferStatus: "",
      transferMessage: "",
    });
  },

  handleTransferSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      transferStatus: "Success",
      transferMessage: `Authorized transfer with PIN: ${e.detail.values?.transferPin}`,
    });
  },

  handleTransferError() {
    this.setData({
      transferStatus: "Error",
      transferMessage: "Please enter your 6-digit authorization PIN.",
    });
  },

  getPreferencesForm(): FormRef | null {
    return this.selectComponent("#preferences-form") as FormRef | null;
  },

  submitPreferences() {
    this.getPreferencesForm()?.submit?.();
  },

  resetPreferences() {
    this.getPreferencesForm()?.reset?.();
    this.setData({
      preferencesStatus: "",
      preferencesMessage: "",
    });
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
      preferencesMessage: `Preferences updated: ${JSON.stringify(e.detail.values)}`,
    });
  },
});
