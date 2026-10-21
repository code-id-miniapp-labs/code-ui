Page({
  data: {
    selectedCollection: "tabler",
    selectedSize: "lg",
    selectedColor: "primary",
    collections: ["tabler", "lucide"],

    // Tabler Icons (15 curated)
    tablerIcons: [
      {
        id: "home",
        name: "i-tabler-home",
        label: "Home",
        category: "Navigation",
      },
      { id: "user", name: "i-tabler-user", label: "User", category: "Social" },
      {
        id: "heart",
        name: "i-tabler-heart",
        label: "Heart",
        category: "Social",
      },
      {
        id: "search",
        name: "i-tabler-search",
        label: "Search",
        category: "Action",
      },
      { id: "mail", name: "i-tabler-mail", label: "Mail", category: "Social" },
      {
        id: "calendar",
        name: "i-tabler-calendar",
        label: "Calendar",
        category: "Action",
      },
      {
        id: "camera",
        name: "i-tabler-camera",
        label: "Camera",
        category: "Media",
      },
      {
        id: "settings",
        name: "i-tabler-settings",
        label: "Settings",
        category: "Navigation",
      },
      {
        id: "shield-check",
        name: "i-tabler-shield-check",
        label: "Shield Check",
        category: "Status",
      },
      {
        id: "sparkles",
        name: "i-tabler-sparkles",
        label: "Sparkles",
        category: "Action",
      },
      {
        id: "flame",
        name: "i-tabler-flame",
        label: "Flame",
        category: "Status",
      },
      {
        id: "circle-check",
        name: "i-tabler-circle-check",
        label: "Circle Check",
        category: "Status",
      },
      {
        id: "loader",
        name: "i-tabler-loader-2",
        label: "Loader",
        category: "Status",
        spin: true,
      },
    ],
    // Lucide Icons (15 curated)
    lucideIcons: [
      {
        id: "house",
        name: "i-lucide-house",
        label: "House",
        category: "Navigation",
      },
      { id: "user", name: "i-lucide-user", label: "User", category: "Social" },
      {
        id: "heart",
        name: "i-lucide-heart",
        label: "Heart",
        category: "Social",
      },
      { id: "star", name: "i-lucide-star", label: "Star", category: "Action" },
      { id: "bell", name: "i-lucide-bell", label: "Bell", category: "Status" },
      {
        id: "search",
        name: "i-lucide-search",
        label: "Search",
        category: "Action",
      },
      { id: "mail", name: "i-lucide-mail", label: "Mail", category: "Social" },
      {
        id: "calendar",
        name: "i-lucide-calendar",
        label: "Calendar",
        category: "Action",
      },
      {
        id: "camera",
        name: "i-lucide-camera",
        label: "Camera",
        category: "Media",
      },
      {
        id: "settings",
        name: "i-lucide-settings",
        label: "Settings",
        category: "Navigation",
      },
      {
        id: "shield-check",
        name: "i-lucide-shield-check",
        label: "Shield Check",
        category: "Status",
      },
      {
        id: "sparkles",
        name: "i-lucide-sparkles",
        label: "Sparkles",
        category: "Action",
      },
      {
        id: "flame",
        name: "i-lucide-flame",
        label: "Flame",
        category: "Status",
      },
      {
        id: "circle-check",
        name: "i-lucide-circle-check",
        label: "Circle Check",
        category: "Status",
      },
      {
        id: "loader",
        name: "i-lucide-loader-circle",
        label: "Loader",
        category: "Status",
        spin: true,
      },
    ],
    // Built-in aliases configured via cui.config.ts
    aliases: [
      { name: "check", label: "check" },
      { name: "minus", label: "minus" },
      { name: "close", label: "close" },
      { name: "loading", label: "loading", spin: true },
    ],
    // Cross-collection side-by-side comparison
    comparison: [
      { label: "Heart", lucide: "lucide:heart", tabler: "tabler:heart" },
      { label: "Star", lucide: "lucide:star", tabler: "tabler:star" },
      {
        label: "Settings",
        lucide: "lucide:settings",
        tabler: "tabler:settings",
      },
      { label: "Bell", lucide: "lucide:bell", tabler: "tabler:bell" },
      { label: "Flame", lucide: "lucide:flame", tabler: "tabler:flame" },
    ],
    copiedName: "",
  },

  onSelectCollection(e: WechatMiniprogram.CustomEvent) {
    const col = e.currentTarget.dataset.collection;
    if (col) {
      this.setData({ selectedCollection: col });
    }
  },

  onSelectSize(e: WechatMiniprogram.CustomEvent) {
    const size = e.currentTarget.dataset.size;
    if (size) {
      this.setData({ selectedSize: size });
    }
  },

  onSelectColor(e: WechatMiniprogram.CustomEvent) {
    const color = e.currentTarget.dataset.color;
    if (color) {
      this.setData({ selectedColor: color });
    }
  },

  copyIconTag(e: WechatMiniprogram.CustomEvent) {
    const name = e.currentTarget.dataset.name;
    const spin = Boolean(e.currentTarget.dataset.spin);
    if (!name) return;

    const snippet = spin
      ? `<c-icon name="${name}" spin />`
      : `<c-icon name="${name}" />`;

    wx.setClipboardData({
      data: snippet,
      success: () => {
        this.setData({ copiedName: name });
        wx.showToast({
          title: `Copied ${name}`,
          icon: "none",
          duration: 1500,
        });
      },
    });
  },
});
