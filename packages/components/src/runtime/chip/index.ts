import { computedBehavior, createComponentOptions } from "../_shared";
import { resolveSlots } from "../../utils/ui";
import themeConfig from "virtual:cui/theme/chip";
import { tv } from "../../utils/variants";

const chipTheme = tv(themeConfig);

Component(
  createComponentOptions({
    behaviors: [computedBehavior],

    options: {
      multipleSlots: true,
      addGlobalClass: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: {
      text: {
        type: String,
        optionalTypes: [Number],
        value: "",
      },
      color: {
        type: String,
        value: "primary",
      },
      size: {
        type: String,
        value: "md",
      },
      position: {
        type: String,
        value: "top-right",
      },
      inset: {
        type: Boolean,
        value: false,
      },
      standalone: {
        type: Boolean,
        value: false,
      },
      show: {
        type: Boolean,
        value: true,
      },
      ui: {
        type: Object,
        value: {},
      },
      class: {
        type: String,
        value: "",
      },
    },

    computed: {
      classes() {
        const color = this.data.color;
        const size = this.data.size;
        const position = this.data.position;
        const inset = Boolean(this.data.inset);
        const standalone = Boolean(this.data.standalone);
        const ui = this.data.ui;

        const themeFns = chipTheme({
          color,
          size,
          position,
          inset,
          standalone,
        });

        return resolveSlots(themeFns, ui, this.data.class);
      },
    },
  }),
);
