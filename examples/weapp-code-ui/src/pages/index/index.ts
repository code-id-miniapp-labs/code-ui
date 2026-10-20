Page({
  data: {
    components: [
      {
        id: "button",
        name: "Button",
        desc: "Interactive triggers with solid, outline, soft variants & async auto-loading.",
        badge: "Interactive",
        path: "/pages/button/index",
      },
      {
        id: "input",
        name: "Input",
        desc: "Text input with controlled value, clearable button, leading/trailing icons & Form link.",
        badge: "Interactive",
        path: "/pages/input/index",
      },
      {
        id: "pin-input",
        name: "PinInput",
        desc: "Zag.js OTP cells with auto-advance, password masking & separator dividers.",
        badge: "Interactive",
        path: "/pages/pin-input/index",
      },
      {
        id: "switch",
        name: "Switch",
        desc: "Toggle switch with Nuxt UI v4 styling, controlled checked, custom colors, sizes, and Form link.",
        badge: "Interactive",
        path: "/pages/switch/index",
      },
      {
        id: "card",
        name: "Card",
        desc: "Containers with structured header, body, footer slots & surface styling.",
        badge: "Layout",
        path: "/pages/card/index",
      },
      {
        id: "chip",
        name: "Chip",
        desc: "Corner badge indicators, counters, and standalone notification pills.",
        badge: "Display",
        path: "/pages/chip/index",
      },
      {
        id: "drawer",
        name: "Drawer",
        desc: "Gesture-driven bottom sheet with backdrop dimming & multiple placements.",
        badge: "Interactive",
        path: "/pages/drawer/index",
      },
      {
        id: "form",
        name: "Form & Validation",
        desc: "EventBus validation engine with errorBag, rules, focusOnError & coexisting forms.",
        badge: "Form",
        path: "/pages/form/index",
      },
      {
        id: "use-child",
        name: "useChild (Scoped Slots)",
        desc: "Reactive snapshot subscription to child components without event emitters or manual setData.",
        badge: "Composable",
        path: "/pages/use-child/index",
      },
    ],
  },

  navigateToComponent(e: WechatMiniprogram.CustomEvent) {
    const path = e.currentTarget.dataset.path;
    if (path) {
      wx.navigateTo({ url: path });
    }
  },
});
