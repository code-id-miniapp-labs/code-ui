Page({
  data: {
    // 1. Interactive Compound Demo
    activeValue: ["getting-started"],
    multiple: false,
    collapsible: true,
    size: "md",
    sizeOptions: ["sm", "md", "lg"],
    variant: "outline",
    variantOptions: ["outline", "subtle", "soft", "plain", "separated"],

    // 2. Data-Driven Items
    dataValue: ["faq-1"],
    dataItems: [
      {
        value: "faq-1",
        label: "What is Code UI?",
        description: "Library overview & core capabilities",
        icon: "i-lucide-layers",
        content:
          "Code UI is a headless, reactive UI component library built specifically for WeChat MiniPrograms, combining Zag.js-inspired state machines with Nuxt UI v4 design tokens.",
      },
      {
        value: "faq-2",
        label: "How does relation behavior work?",
        description: "Parent-child linking without manual wiring",
        icon: "i-lucide-cpu",
        content:
          "Parent components like cui-accordion automatically link to child cui-accordion-item components using native WeChat MiniProgram relations and reactive event buses.",
      },
      {
        value: "faq-3",
        label: "Can items be controlled individually?",
        description: "Standalone or parent-linked operation",
        icon: "i-lucide-sliders",
        content:
          "Yes! Each cui-accordion-item can operate either standalone with its own open/defaultOpen props, or connected to an ancestor cui-accordion.",
      },
      {
        value: "faq-4",
        label: "Disabled Item Example",
        description: "Non-interactive locked section",
        icon: "i-lucide-lock",
        disabled: true,
        content: "This content is locked and cannot be expanded.",
      },
    ],

    // 3. Separated Cards Demo
    separatedValue: ["item-1"],
  },

  onAccordionChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail?.value;
    const nextValue = Array.isArray(value) ? value : value ? [value] : [];
    if (
      !this.data.collapsible &&
      nextValue.length === 0 &&
      this.data.activeValue.length > 0
    ) {
      return;
    }
    this.setData({
      activeValue: nextValue,
    });
  },

  onDataAccordionChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail?.value;
    this.setData({
      dataValue: Array.isArray(value) ? value : [value],
    });
  },

  onSeparatedChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail?.value;
    this.setData({
      separatedValue: Array.isArray(value) ? value : [value],
    });
  },

  toggleMultiple() {
    const nextMultiple = !this.data.multiple;
    this.setData({
      multiple: nextMultiple,
      activeValue:
        !nextMultiple && this.data.activeValue.length > 1
          ? [this.data.activeValue[0]]
          : this.data.activeValue,
    });
  },

  toggleCollapsible(e: WechatMiniprogram.CustomEvent) {
    const nextCollapsible =
      typeof e?.detail?.checked === "boolean"
        ? e.detail.checked
        : typeof e?.detail?.value === "boolean"
          ? e.detail.value
          : !this.data.collapsible;
    this.setData({
      collapsible: nextCollapsible,
      activeValue:
        !nextCollapsible && this.data.activeValue.length === 0
          ? ["getting-started"]
          : this.data.activeValue,
    });
  },

  selectSize(e: WechatMiniprogram.CustomEvent) {
    const size = e.currentTarget.dataset.size;
    if (size) {
      this.setData({ size });
    }
  },

  selectVariant(e: WechatMiniprogram.CustomEvent) {
    const variant = e.currentTarget.dataset.variant;
    if (variant) {
      this.setData({ variant });
    }
  },

  expandAll() {
    this.setData({
      multiple: true,
      activeValue: ["getting-started", "components", "theming"],
    });
  },

  collapseAll() {
    if (!this.data.collapsible) return;
    this.setData({
      activeValue: [],
    });
  },
});

