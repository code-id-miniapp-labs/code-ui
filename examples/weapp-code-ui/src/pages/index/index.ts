Page({
  data: {
    components: [
      {
        id: "avatar",
        name: "Avatar",
        desc: "User profile representation with image, initials, and icon fallbacks.",
        badge: "Display",
        path: "/pages/avatar/index",
      },
      {
        id: "avatar-group",
        name: "AvatarGroup",
        desc: "Stack multiple avatars with overlapping offsets, border rings, and overflow counter (+N).",
        badge: "Display",
        path: "/pages/avatar-group/index",
      },
      {
        id: "badge",
        name: "Badge",
        desc: "-",
        badge: "Display",
        path: "/pages/badge/index",
      },
      {
        id: "skeleton",
        name: "Skeleton",
        desc: "-",
        badge: "Display",
        path: "/pages/skeleton/index",
      },
      {
        id: "divider",
        name: "Divider",
        desc: "Separators with labels, icons, slots, horizontal/vertical orientations, and styling.",
        badge: "Display",
        path: "/pages/divider/index",
      },
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
        desc: "OTP cells with auto-advance, password masking & separator dividers.",
        badge: "Interactive",
        path: "/pages/pin-input/index",
      },
      {
        id: "switch",
        name: "Switch",
        desc: "Toggle switch, controlled checked, custom colors, sizes, and Form link.",
        badge: "Interactive",
        path: "/pages/switch/index",
      },
      {
        id: "checkbox",
        name: "Checkbox & CheckboxGroup",
        desc: "Accessible checkbox and multi-select groups with indeterminate state, card variants, min/max limits & Form link.",
        badge: "Interactive",
        path: "/pages/checkbox/index",
      },
      {
        id: "radio",
        name: "Radio & RadioGroup",
        desc: "Accessible radio buttons with pure CSS geometry, card variants, horizontal layout, useChild & Form link.",
        badge: "Interactive",
        path: "/pages/radio/index",
      },
      {
        id: "textarea",
        name: "Textarea",
        desc: "Multi-line textarea, controlled value, character counter, auto-height, and Form link.",
        badge: "Interactive",
        path: "/pages/textarea/index",
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
        id: "icon",
        name: "Icon",
        desc: "Vector icon masks with dynamic collections, semantic colors, sizing, and spinning animation.",
        badge: "Display",
        path: "/pages/icon/index",
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
      {
        id: "qr-code",
        name: "QR Code",
        desc: "Universal QR code generator powered by uqr, with SVG path rendering, custom error correction levels, sizes, colors, and center overlay logo.",
        badge: "Interactive",
        path: "/pages/qr-code/index",
      },
      {
        id: "stepper",
        name: "Stepper",
        desc: "Progress indicators for multi-step workflows with compound items, custom slots, linear guards, and vertical orientation.",
        badge: "Interactive",
        path: "/pages/stepper/index",
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
