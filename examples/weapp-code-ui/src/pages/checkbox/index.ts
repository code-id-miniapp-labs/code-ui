Page({
  data: {
    // 1. Controlled Standalone Checkbox
    controlledChecked: false,

    // 2. Indeterminate State
    notificationChannels: [
      { id: "email", label: "Email Digest", checked: true },
      { id: "sms", label: "SMS Alerts", checked: false },
      { id: "push", label: "Push Notifications", checked: false },
      { id: "inapp", label: "In-App Messages", checked: true },
    ],
    isAllNotificationsSelected: false,
    isSomeNotificationsSelected: true,

    // 3. Controlled Checkbox Group
    selectedFruits: ["apple", "cherry"],
    selectedFruitsJson: '["apple", "cherry"]',

    // 4. Auto-rendered Items Prop
    techOptions: [
      {
        value: "ts",
        label: "TypeScript",
        description: "Typed JavaScript at any scale",
      },
      {
        value: "rs",
        label: "Rust",
        description: "Memory-safe high-performance systems",
      },
      {
        value: "go",
        label: "Go",
        description: "Simplicity, concurrency, and fast compile times",
      },
      {
        value: "cpp",
        label: "C++ (Archived)",
        description: "Low-level system access (not available)",
        disabled: true,
      },
    ],
    selectedTechs: ["ts", "rs"],
    selectedTechsJson: '["ts", "rs"]',

    // 5. Min & Max Limits
    limitedRoles: ["frontend"],
    roleOptions: [
      { value: "frontend", label: "Frontend Engineer" },
      { value: "backend", label: "Backend Engineer" },
      { value: "designer", label: "UI/UX Designer" },
      { value: "devops", label: "DevOps & Cloud Engineer" },
    ],

    // 6. Card Variant
    selectedAddons: ["priority"],

    // 7. Horizontal Orientation
    selectedTags: ["react", "vite"],

    // 8. Form & Validation
    formInterests: [] as string[],
    formAgreement: false,
    interestRules: [
      {
        validator: (val: string[]) => Array.isArray(val) && val.length >= 2,
        message: "Please choose at least 2 areas of interest",
      },
    ],
    agreementRules: [
      {
        required: true,
        message: "You must accept the terms of service to proceed",
      },
      {
        validator: (val: boolean) => val === true,
        message: "Terms agreement must be checked",
      },
    ],
    formStatus: "",
    formMessage: "",
  },

  onLoad() {
    this.updateNotificationMasterState();
  },

  // 1. Controlled Standalone Handlers
  onControlledChange(e: WechatMiniprogram.CustomEvent<{ checked: boolean }>) {
    this.setData({
      controlledChecked: Boolean(e.detail.checked),
    });
  },

  setControlledTrue() {
    this.setData({ controlledChecked: true });
  },

  setControlledFalse() {
    this.setData({ controlledChecked: false });
  },

  toggleControlled() {
    this.setData({ controlledChecked: !this.data.controlledChecked });
  },

  // 2. Indeterminate Channel Handlers
  updateNotificationMasterState() {
    const channels = this.data.notificationChannels;
    const checkedCount = channels.filter((c) => c.checked).length;
    const totalCount = channels.length;

    const isAll = checkedCount === totalCount;
    const isSome = checkedCount > 0 && checkedCount < totalCount;

    this.setData({
      isAllNotificationsSelected: isAll,
      isSomeNotificationsSelected: isSome,
    });
  },

  onMasterNotificationToggle(
    e: WechatMiniprogram.CustomEvent<{ checked: boolean }>,
  ) {
    const nextChecked = Boolean(e.detail.checked);
    const updated = this.data.notificationChannels.map((ch) => ({
      ...ch,
      checked: nextChecked,
    }));
    this.setData({ notificationChannels: updated });
    this.updateNotificationMasterState();
  },

  onNotificationChannelToggle(
    e: WechatMiniprogram.CustomEvent<{ checked: boolean }>,
  ) {
    const targetId = e.currentTarget.dataset.id;
    const nextChecked = Boolean(e.detail.checked);
    const updated = this.data.notificationChannels.map((ch) => {
      if (ch.id === targetId) {
        return { ...ch, checked: nextChecked };
      }
      return ch;
    });
    this.setData({ notificationChannels: updated });
    this.updateNotificationMasterState();
  },

  // 3. Controlled Group Handlers
  onFruitsChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    const nextVal = e.detail.value ?? [];
    this.setData({
      selectedFruits: nextVal,
      selectedFruitsJson: JSON.stringify(nextVal),
    });
  },

  selectAllFruits() {
    const all = ["apple", "banana", "cherry", "mango"];
    this.setData({
      selectedFruits: all,
      selectedFruitsJson: JSON.stringify(all),
    });
  },

  setFavoriteFruits() {
    const favs = ["apple", "cherry"];
    this.setData({
      selectedFruits: favs,
      selectedFruitsJson: JSON.stringify(favs),
    });
  },

  clearFruits() {
    this.setData({
      selectedFruits: [],
      selectedFruitsJson: "[]",
    });
  },

  // 4. Data-driven Group Handlers
  onTechsChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    const nextVal = e.detail.value ?? [];
    this.setData({
      selectedTechs: nextVal,
      selectedTechsJson: JSON.stringify(nextVal),
    });
  },

  // 5. Min & Max Limit Handlers
  onRolesChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({
      limitedRoles: e.detail.value ?? [],
    });
  },

  // 6. Card Variant Handlers
  onAddonsChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({
      selectedAddons: e.detail.value ?? [],
    });
  },

  // 7. Horizontal Tags Handlers
  onTagsChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({
      selectedTags: e.detail.value ?? [],
    });
  },

  // 8. Form Integration Handlers
  onFormInterestsChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({
      formInterests: e.detail.value ?? [],
    });
  },

  onFormAgreementChange(
    e: WechatMiniprogram.CustomEvent<{ checked: boolean }>,
  ) {
    this.setData({
      formAgreement: Boolean(e.detail.checked),
    });
  },

  getForm(): any {
    return this.selectComponent("#checkbox-demo-form");
  },

  submitForm() {
    this.getForm()?.submit?.();
  },

  resetForm() {
    this.getForm()?.reset?.();
    this.setData({
      formInterests: [],
      formAgreement: false,
      formStatus: "",
      formMessage: "",
    });
  },

  handleFormSubmit(e: WechatMiniprogram.CustomEvent<{ values: any }>) {
    this.setData({
      formStatus: "Success",
      formMessage: `Registration successful! Payload: ${JSON.stringify(e.detail.values)}`,
    });
  },

  handleFormError(e: WechatMiniprogram.CustomEvent<{ errors: any }>) {
    this.setData({
      formStatus: "Error",
      formMessage: `Validation failed: ${JSON.stringify(e.detail.errors || "Please complete all required fields")}`,
    });
  },
});
