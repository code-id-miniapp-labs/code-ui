import { staticComputedBehavior, createComponentOptions } from "../_shared/base";
import { highlightWords } from "./utils";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";
import themeConfig from "virtual:cui/theme/highlight";

const highlightTheme = tv(themeConfig);

Component(
  createComponentOptions({
    behaviors: [staticComputedBehavior],

    properties: {
      text: {
        type: String,
        value: "",
      },
      query: {
        type: String,
        optionalTypes: [Array],
        value: "",
      },
      ignoreCase: {
        type: Boolean,
        value: true,
      },
      matchAll: {
        type: Boolean,
        value: true,
      },
      exactMatch: {
        type: Boolean,
        value: false,
      },
      color: {
        type: String,
        value: "primary",
      },
      variant: {
        type: String,
        value: "soft",
      },
      size: {
        type: String,
        value: "",
      },
      rounded: {
        type: Boolean,
        value: true,
      },
      markStyle: {
        type: String,
        value: "",
      },
      userSelect: {
        type: Boolean,
        value: false,
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
      chunks() {
        return highlightWords(this.data.text, this.data.query, {
          ignoreCase: this.data.ignoreCase,
          matchAll: this.data.matchAll,
          exactMatch: this.data.exactMatch,
        });
      },

      classes() {
        const size = this.data.size;
        const themeFns = highlightTheme({
          color: this.data.color,
          variant: this.data.variant,
          ...(size ? { size } : {}),
          rounded: Boolean(this.data.rounded),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },
  }),
);
