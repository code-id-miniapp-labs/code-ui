import { computedBehavior, createComponentOptions } from "../_shared/base";
import { resolveSlots } from "../../utils/ui";
import themeConfig from "virtual:cui/theme/card";
import { tv } from "../../utils/variants";

const cardTheme = tv(themeConfig);

Component(
  createComponentOptions({
    behaviors: [computedBehavior],

    slots: {
      default: false,
      header: false,
      footer: false,
    },

    properties: {
      variant: {
        type: String,
        value: "outline",
      },
      size: {
        type: String,
        value: "md",
      },
      title: {
        type: String,
        value: "",
      },
      description: {
        type: String,
        value: "",
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
        const variant = this.data.variant;
        const size = this.data.size;
        const ui = this.data.ui;

        const themeFns = cardTheme({
          variant,
          size,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },
  }),
);
