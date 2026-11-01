Page({
  data: {
    singleValue: 35,
    rangeValue: [20, 80],
    stepValue: 40,
    marks: [
      { value: 0, label: "0°C" },
      { value: 25, label: "25°C" },
      { value: 50, label: "50°C" },
      { value: 75, label: "75°C" },
      { value: 100, label: "100°C" },
    ],
    lastEvent: "None",
  },

  onSingleChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      singleValue: e.detail.value,
      lastEvent: `single change: ${e.detail.value}`,
    });
  },

  onRangeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      rangeValue: e.detail.value,
      lastEvent: `range change: [${e.detail.values.join(", ")}]`,
    });
  },

  setSingleTo70() {
    this.setData({
      singleValue: 70,
    });
  },
});

