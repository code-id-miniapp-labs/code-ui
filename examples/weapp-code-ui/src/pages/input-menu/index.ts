Page({
  data: {
    basicItems: ["Backlog", "Todo", "In Progress", "Done", "Cancelled"],
    basicValue: "Todo",

    multipleItems: [
      { label: "Apple", value: "apple", icon: "i-lucide-apple" },
      { label: "Banana", value: "banana", icon: "i-lucide-banana" },
      { label: "Blueberry", value: "blueberry", icon: "i-lucide-cherry" },
      {
        label: "Grapes",
        value: "grapes",
        disabled: true,
        icon: "i-lucide-grape",
      },
    ],
    multipleValue: ["apple"],

    creatableItems: ["Feature", "Bugfix", "Refactor", "Docs"],
    creatableValue: ["Feature"],

    groupedItems: [
      [
        { type: "label", label: "Fruits" },
        {
          label: "Apple",
          value: "apple",
          description: "Crisp red orchard fruit",
        },
        { label: "Orange", value: "orange", description: "Sweet citrus" },
      ],
      [
        { type: "label", label: "Vegetables" },
        { label: "Carrot", value: "carrot", description: "Crunchy root" },
        { label: "Broccoli", value: "broccoli", description: "Green florets" },
      ],
    ],

    assigneeValue: "alice",

    variants: ["outline", "soft", "subtle", "ghost", "none"],
    sizes: ["xs", "sm", "md", "lg", "xl"],
  },

  onBasicChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ basicValue: e.detail.value });
  },

  onMultipleChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ multipleValue: e.detail.value });
  },

  onCreatableChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ creatableValue: e.detail.value });
  },

  onCreateTag(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const newTag = e.detail?.value?.trim();
    if (!newTag) return;
    const items = this.data.creatableItems.includes(newTag)
      ? this.data.creatableItems
      : [...this.data.creatableItems, newTag];
    const value = this.data.creatableValue.includes(newTag)
      ? this.data.creatableValue
      : [...this.data.creatableValue, newTag];
    this.setData({
      creatableItems: items,
      creatableValue: value,
    });
  },

  onAssigneeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ assigneeValue: e.detail.value });
  },
});
