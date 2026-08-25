/// <reference types="miniprogram-api-typings" />

/**
 * Reusable WeChat MiniProgram behavior providing full native `<button>`
 * platform properties (openType, formType, hoverClass, customer service, privacy)
 * and event forwarding.
 */
export const wxButtonBehavior = Behavior({
  properties: {
    openType: {
      type: String,
      value: "",
    },
    formType: {
      type: String,
      value: "",
    },
    hoverClass: {
      type: String,
      value: "",
    },
    hoverStartTime: {
      type: Number,
      value: 20,
    },
    hoverStayTime: {
      type: Number,
      value: 70,
    },
    hoverStopPropagation: {
      type: Boolean,
      value: false,
    },
    lang: {
      type: String,
      value: "en",
    },
    sessionFrom: {
      type: String,
      value: "",
    },
    sendMessageTitle: {
      type: String,
      value: "",
    },
    sendMessagePath: {
      type: String,
      value: "",
    },
    sendMessageImg: {
      type: String,
      value: "",
    },
    showMessageCard: {
      type: Boolean,
      value: false,
    },
    appParameter: {
      type: String,
      value: "",
    },
  },

  methods: {
    handleGetPhoneNumber(e: any) {
      this.triggerEvent("getphonenumber", e.detail);
    },
    handleChooseAvatar(e: any) {
      this.triggerEvent("chooseavatar", e.detail);
    },
    handleContact(e: any) {
      this.triggerEvent("contact", e.detail);
    },
    handleError(e: any) {
      this.triggerEvent("error", e.detail);
    },
    handleOpenSetting(e: any) {
      this.triggerEvent("opensetting", e.detail);
    },
    handleLaunchApp(e: any) {
      this.triggerEvent("launchapp", e.detail);
    },
    handleAgreePrivacyAuthorization(e: any) {
      this.triggerEvent("agreeprivacyauthorization", e.detail);
    },
  },
});
