export type Placement = "bottom" | "top" | "left" | "right";

export interface IndexPageData {
  isDrawerOpen: boolean;
  placement: Placement;
  threshold: number;
  closeOnBackdrop: boolean;
  dismissible: boolean;
  placements: Placement[];
  isLoadingBtn: boolean;
  years: string[];
  seasons: string[];
  pickerValue: number[];
  selectedYear: string;
  selectedSeason: string;
  pickerDate: string;
  pickerTime: string;
  countries: string[];
  countryIndex: number;
  selectedRegion: string[];
}

export interface IndexPageCustom {
  handleButtonTap: (
    e: WechatMiniprogram.CustomEvent<{ variant?: string }>,
  ) => void;
  handleAsyncAction: () => Promise<void>;
  handleCloseTriggerTap: (e: WechatMiniprogram.CustomEvent) => void;
  handleSelectPlacement: (e: WechatMiniprogram.CustomEvent) => void;
  handleSelectThreshold: (e: WechatMiniprogram.CustomEvent) => void;
  handleBackdropTap: (e: WechatMiniprogram.CustomEvent) => void;
  handleToggleBackdrop: (
    e: WechatMiniprogram.CustomEvent<{ value: boolean }>,
  ) => void;
  handleToggleDismissible: (
    e: WechatMiniprogram.CustomEvent<{ value: boolean }>,
  ) => void;
  handleOpenDrawer: () => void;
  handleDrawerClose: () => void;
  handlePickerChange: (
    e: WechatMiniprogram.CustomEvent<{ value: number[] }>,
  ) => void;
  handleDateChange: (
    e: WechatMiniprogram.CustomEvent<{ value: string }>,
  ) => void;
  handleTimeChange: (
    e: WechatMiniprogram.CustomEvent<{ value: string }>,
  ) => void;
  handleCountryChange: (
    e: WechatMiniprogram.CustomEvent<{ value: number }>,
  ) => void;
  handleRegionChange: (
    e: WechatMiniprogram.CustomEvent<{ value: string[] }>,
  ) => void;
}

const years = ["2022", "2023", "2024", "2025", "2026"];
const seasons = ["Spring", "Summer", "Autumn", "Winter"];
const countries = ["United States", "China", "Indonesia", "Japan", "Germany"];

Page<IndexPageData, IndexPageCustom>({
  data: {
    isDrawerOpen: false,
    placement: "bottom",
    threshold: 80,
    closeOnBackdrop: true,
    isLoadingBtn: false,
    dismissible: true,
    placements: ["bottom", "top", "left", "right"],
    years,
    seasons,
    pickerValue: [2, 1],
    selectedYear: years[2],
    selectedSeason: seasons[1],
    pickerDate: "2026-08-26",
    pickerTime: "18:45",
    countries,
    countryIndex: 2,
    selectedRegion: ["Guangdong", "Shenzhen", "Nanshan"],
  },

  handleButtonTap(e) {
    const variant = e.currentTarget.dataset.variant || "button";
    wx.showToast({
      title: `${variant} tapped`,
      icon: "none",
      duration: 1200,
    });
  },

  handleAsyncAction() {
    this.setData({
      isLoadingBtn: true,
    });
    return new Promise((resolve) => {
      setTimeout(() => {
        wx.showToast({
          title: "Async action resolved!",
          icon: "success",
          duration: 1500,
        });
        resolve();
        this.setData({
          isLoadingBtn: false,
        });
      }, 2000);
    });
  },

  handleSelectPlacement(e) {
    const placement = e.currentTarget.dataset.placement as Placement;
    this.setData({
      placement,
      isDrawerOpen: true,
    });
  },

  handleSelectThreshold(e) {
    const threshold = Number(e.currentTarget.dataset.threshold);
    this.setData({ threshold });
  },

  handleBackdropTap(ev) {
    console.log(ev);
  },

  handleCloseTriggerTap(ev) {
    console.log(ev);
  },

  handleToggleBackdrop(e) {
    this.setData({ closeOnBackdrop: e.detail.value });
  },

  handleToggleDismissible(e) {
    this.setData({ dismissible: e.detail.value });
  },

  handleOpenDrawer() {
    this.setData({ isDrawerOpen: true });
  },

  handleDrawerClose() {
    this.setData({ isDrawerOpen: false });
  },

  handlePickerChange(e) {
    const val = e.detail.value;
    this.setData({
      pickerValue: val,
      selectedYear: this.data.years[val[0]] || this.data.years[0],
      selectedSeason: this.data.seasons[val[1]] || this.data.seasons[0],
    });
  },

  handleDateChange(e) {
    this.setData({ pickerDate: e.detail.value });
  },

  handleTimeChange(e) {
    this.setData({ pickerTime: e.detail.value });
  },

  handleCountryChange(e) {
    this.setData({ countryIndex: Number(e.detail.value) });
  },

  handleRegionChange(e) {
    this.setData({ selectedRegion: e.detail.value });
  },
});
