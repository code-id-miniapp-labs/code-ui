import { useChild } from "@code-ui/composables";
import type { UseChildReturn } from "@code-ui/composables";
import type { RadioGroupApi } from "@code-ui/radio-group";

Page({
  tierGroupRef: null as UseChildReturn<any, RadioGroupApi> | null,

  data: {
    // 1. Controlled State
    controlledPlan: "pro",
    lastEvent: "Initial (pro)",

    // 2. useChild Programmatic State
    programmaticGroup: {} as Record<string, any>,
    useChildLastValue: "pro",

    // 3. Auto-rendered items prop
    fruitOptions: [
      {
        value: "apple",
        label: "Fuji Apple",
        description: "Crisp and sweet organic apple",
      },
      {
        value: "banana",
        label: "Cavendish Banana",
        description: "Rich in potassium and natural energy",
      },
      {
        value: "orange",
        label: "Valencia Orange (Sold Out)",
        description: "Fresh and juicy citrus fruit",
        disabled: true,
      },
    ],
    selectedFruit: "apple",

    // 4. Card Variant
    selectedBilling: "annual",

    // 5. Orientation (Horizontal)
    deliverySpeed: "express",

    // 6. Sizes
    previewSize: "md",

    // 7. Colors
    selectedColor: "primary",

    // 8. Custom Indicator
    customDelivery: "pickup",

    // 9. Form & Validation
    formMembership: "",
    membershipRules: [
      {
        required: true,
        message: "Please choose a membership tier to proceed",
      },
    ],
    formStatus: "",
    formMessage: "",
  },

  onReady() {
    // Initialize useChild composable on the programmatically controlled group
    this.tierGroupRef = useChild(this, "#programmatic-radio-group", {
      key: "programmaticGroup",
      onChange: (snapshot) => {
        this.setData({
          useChildLastValue: snapshot?.value ?? "(none)",
        });
      },
    });
  },

  // Controlled component handlers
  onControlledPlanChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      controlledPlan: e.detail.value,
      lastEvent: `change event: ${e.detail.value}`,
    });
  },

  setPlanFree() {
    this.setData({
      controlledPlan: "free",
      lastEvent: "set to 'free' via parent setData",
    });
  },

  setPlanPro() {
    this.setData({
      controlledPlan: "pro",
      lastEvent: "set to 'pro' via parent setData",
    });
  },

  clearControlledPlan() {
    this.setData({
      controlledPlan: "",
      lastEvent: "cleared via parent setData",
    });
  },

  // useChild programmatic control handlers
  useChildSetStarter() {
    this.tierGroupRef?.api?.setValue?.("starter");
  },

  useChildSetEnterprise() {
    this.tierGroupRef?.api?.setValue?.("enterprise");
  },

  useChildClear() {
    this.tierGroupRef?.api?.clear?.();
  },

  // Other section handlers
  onFruitChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      selectedFruit: e.detail.value,
    });
  },

  onBillingChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      selectedBilling: e.detail.value,
    });
  },

  onDeliverySpeedChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      deliverySpeed: e.detail.value,
    });
  },

  onCustomDeliveryChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      customDelivery: e.detail.value,
    });
  },

  // Form handlers
  onFormMembershipChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formMembership: e.detail.value,
    });
  },

  getRadioForm(): any {
    return this.selectComponent("#radio-demo-form");
  },

  submitRadioForm() {
    this.getRadioForm()?.submit?.();
  },

  resetRadioForm() {
    this.getRadioForm()?.reset?.();
    this.setData({
      formMembership: "",
      formStatus: "",
      formMessage: "",
    });
  },

  handleRadioFormSubmit(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formStatus: "Success",
      formMessage: `Form submitted with: ${JSON.stringify(e.detail.values)}`,
    });
  },

  handleRadioFormError(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      formStatus: "Error",
      formMessage: `Validation failed: ${JSON.stringify(e.detail.errors || "Please select a required tier")}`,
    });
  },
});
