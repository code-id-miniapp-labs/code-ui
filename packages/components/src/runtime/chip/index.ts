import { computedBehavior, createComponentOptions } from "../_shared/base";
import { resolveSlots } from "../../utils/ui";
import themeConfig from "virtual:cui/theme/chip";
import { tv } from "../../utils/variants";

const chipTheme = tv(themeConfig);

Component(
  createComponentOptions({
    behaviors: [computedBehavior],
    slots: {
      default: false,
      content: false,
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
      className: {
        type: String,
        value: "",
      },
    },

    computed: {
      classes() {
        const themeFns = chipTheme({
          color: this.data.color,
          size: this.data.size,
          position: this.data.position,
          inset: this.data.inset,
          standalone: this.data.standalone,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },
  }),
);
