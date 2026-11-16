const CITY_MAP: Record<string, { label: string; value: string }[]> = {
  zhejiang: [
    { label: "Hangzhou", value: "hangzhou" },
    { label: "Ningbo", value: "ningbo" },
    { label: "Wenzhou", value: "wenzhou" },
  ],
  jiangsu: [
    { label: "Nanjing", value: "nanjing" },
    { label: "Suzhou", value: "suzhou" },
    { label: "Wuxi", value: "wuxi" },
  ],
  guangdong: [
    { label: "Shenzhen", value: "shenzhen" },
    { label: "Guangzhou", value: "guangzhou" },
    { label: "Zhuhai", value: "zhuhai" },
  ],
};

const PROVINCES = [
  { label: "Zhejiang", value: "zhejiang" },
  { label: "Jiangsu", value: "jiangsu" },
  { label: "Guangdong", value: "guangdong" },
];

Page({
  data: {
    basicItems: ["Backlog", "Todo", "In Progress", "Done"],
    basicValue: "Todo",

    multipleItems: [
      { label: "Apple", value: "apple", icon: "i-lucide-apple" },
      { label: "Banana", value: "banana", icon: "i-lucide-banana" },
      { label: "Blueberry", value: "blueberry", icon: "i-lucide-cherry" },
      { label: "Grapes", value: "grapes", disabled: true },
    ],
    multipleValue: ["apple"],

    groupedItems: [
      [
        { type: "label", label: "Fruits" },
        { label: "Apple", value: "apple", description: "Crisp red orchard fruit" },
        { label: "Orange", value: "orange", description: "Sweet citrus" },
      ],
      [
        { type: "label", label: "Vegetables" },
        { label: "Carrot", value: "carrot", description: "Crunchy root" },
        { label: "Broccoli", value: "broccoli" },
      ],
    ],

    assigneeValue: "alice",

    pickerItems: [
      { label: "Beijing", value: "beijing" },
      { label: "Shanghai", value: "shanghai" },
      { label: "Shenzhen", value: "shenzhen" },
      { label: "Hangzhou", value: "hangzhou" },
      { label: "Chengdu", value: "chengdu" },
    ],
    pickerValue: "shanghai",

    cascadeItems: [PROVINCES, CITY_MAP.zhejiang],
    cascadeValue: ["zhejiang", "hangzhou"],

    variants: ["outline", "soft", "subtle", "ghost", "none"],
    sizes: ["xs", "sm", "md", "lg", "xl"],
    colors: ["primary", "secondary", "neutral", "success", "warning", "danger"],
  },

  onBasicChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ basicValue: e.detail.value });
  },

  onMultipleChange(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ multipleValue: e.detail.value });
  },

  onAssigneeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ assigneeValue: e.detail.value });
  },

  onPickerConfirm(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ pickerValue: e.detail.value });
  },

  onCascadeColumnChange(
    e: WechatMiniprogram.CustomEvent<{
      column: number;
      value: string;
    }>,
  ) {
    if (e.detail.column === 0) {
      const cities = CITY_MAP[e.detail.value] ?? [];
      this.setData({
        cascadeItems: [PROVINCES, cities],
      });
    }
  },

  onCascadeConfirm(e: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ cascadeValue: e.detail.value });
  },
});
