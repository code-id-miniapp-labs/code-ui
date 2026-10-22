import { computedBehavior, createComponentOptions } from "../_shared";
import { resolveSlots } from "../../utils/ui";
import themeConfig from "virtual:cui/theme/avatar";
import { tv } from "../../utils/variants";

const avatarTheme = tv(themeConfig);

Component(
  createComponentOptions({
    options: {
      styleIsolation: "apply-shared",
      virtualHost: true,
    },
    behaviors: [computedBehavior],
    properties: {
      className: {
        type: String,
        value: "",
      },
      src: {
        type: String,
        value: "",
      },
      alt: {
        type: String,
        value: "",
      },
      mode: {
        type: String,
        value: "aspectFill",
      },
      lazyLoad: {
        type: Boolean,
        value: true,
      },
      color: {
        type: String,
        value: "neutral",
      },
      icon: {
        type: String,
        value: "",
      },
      text: {
        type: String,
        value: "",
      },
      size: {
        type: String,
        value: "md",
      },
      ui: {
        type: Object,
        value: {},
      },
    },
    data: {
      imageError: false,
    },
    computed: {
      classes() {
        const size = this.data.size;
        const ui = this.data.ui;
        const color = this.data.color;
        const theme = avatarTheme({
          size,
          color,
        });

        return resolveSlots(theme, ui, this.data.className);
      },

      fallbackText() {
        const text = this.data.text || this.data.alt || "";

        return text
          .split(" ")
          .map((word) => word.charAt(0))
          .join("")
          .substring(0, 2);
      },
    },
    methods: {
      onImageError() {
        this.setData({ imageError: true });
      },
    },
  }),
);
