Page({
  data: {
    // 1. Interactive Compound Tabs
    activeTab: "account",
    fitted: false,
    variant: "pill",
    variantOptions: ["pill", "link"],
    orientation: "horizontal",
    orientationOptions: ["horizontal", "vertical"],
    size: "md",
    sizeOptions: ["xs", "sm", "md", "lg", "xl"],
    color: "primary",
    colorOptions: [
      "primary",
      "neutral",
      "success",
      "warning",
      "danger",
      "info",
    ],

    // 2. Data-Driven Items
    dataTab: "preview",
    dataItems: [
      {
        value: "preview",
        label: "Preview",
        icon: "i-lucide-eye",
        content:
          "Live preview of the rendered component hierarchy in the WeChat MiniProgram environment.",
      },
      {
        value: "code",
        label: "Source Code",
        icon: "i-lucide-code",
        content: '<c-tabs items="{{items}}" value="preview" color="primary" />',
      },
      {
        value: "changelog",
        label: "Changelog",
        icon: "i-lucide-sparkles",
        content:
          "What's new in v1.2: Added compound tabs-item support, vertical orientation, and indicator transitions.",
      },
      {
        value: "disabled",
        label: "Disabled Tab",
        icon: "i-lucide-lock",
        disabled: true,
        content: "This content is locked and cannot be selected.",
      },
    ],

    // 3. Link Variant Tab
    linkTab: "overview",

    // 4. Vertical Tabs
    verticalTab: "general",

    // 5. Scrollable Tabs
    scrollTab: "all",
    scrollItems: [
      { value: "all", label: "All Topics" },
      { value: "tech", label: "Technology" },
      { value: "design", label: "Design" },
      { value: "dev", label: "Development" },
      { value: "business", label: "Business" },
      { value: "marketing", label: "Marketing" },
      { value: "finance", label: "Finance" },
      { value: "lifestyle", label: "Lifestyle" },
      { value: "travel", label: "Travel" },
    ],
  },

  onTabChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail?.value;
    if (value !== undefined) {
      this.setData({ activeTab: value });
    }
  },

  onDataTabChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail?.value;
    if (value !== undefined) {
      this.setData({ dataTab: value });
    }
  },

  onLinkTabChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail?.value;
    if (value !== undefined) {
      this.setData({ linkTab: value });
    }
  },

  onVerticalTabChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail?.value;
    if (value !== undefined) {
      this.setData({ verticalTab: value });
    }
  },

  onScrollTabChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail?.value;
    if (value !== undefined) {
      this.setData({ scrollTab: value });
    }
  },

  selectVariant(e: WechatMiniprogram.CustomEvent) {
    const variant = e.currentTarget.dataset.variant;
    if (variant) {
      this.setData({ variant });
    }
  },

  selectOrientation(e: WechatMiniprogram.CustomEvent) {
    const orientation = e.currentTarget.dataset.orientation;
    if (orientation) {
      this.setData({ orientation });
    }
  },

  selectSize(e: WechatMiniprogram.CustomEvent) {
    const size = e.currentTarget.dataset.size;
    if (size) {
      this.setData({ size });
    }
  },

  selectColor(e: WechatMiniprogram.CustomEvent) {
    const color = e.currentTarget.dataset.color;
    if (color) {
      this.setData({ color });
    }
  },

  toggleFitted() {
    this.setData({ fitted: !this.data.fitted });
  },

  prevTab() {
    const tabsComp = this.selectComponent("#interactive-tabs");
    tabsComp?.selectPrev?.();
  },

  nextTab() {
    const tabsComp = this.selectComponent("#interactive-tabs");
    tabsComp?.selectNext?.();
  },

  selectAccount() {
    this.setData({ activeTab: "account" });
  },

  selectSecurity() {
    this.setData({ activeTab: "security" });
  },

  selectBilling() {
    this.setData({ activeTab: "billing" });
  },
});
