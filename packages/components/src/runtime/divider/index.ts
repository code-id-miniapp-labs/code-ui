import { computedBehavior, createComponentOptions } from "../_shared/base";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";
import themeConfig from "virtual:cui/theme/divider";

const dividerTheme = tv(themeConfig);

Component(
  createComponentOptions({
    options: {
      virtualHost: true,
      multipleSlots: true,
      styleIsolation: "apply-shared",
    },
    properties: {
      ui: {
        type: Object,
        value: {},
      },
      className: {
        type: String,
        value: "",
      },
      class: {
        type: String,
        value: "",
      },
      color: {
        type: String,
        value: "neutral",
      },
      size: {
        type: String,
        value: "md",
      },
      type: {
        type: String,
        value: "solid",
      },
      content: {
        type: Boolean,
        value: false,
      },
      label: {
        type: String,
        value: "",
      },
      orientation: {
        type: String,
        value: "horizontal",
      },
      position: {
        type: String,
        value: "center",
      },
      leadingIcon: {
        type: String,
        value: "",
      },
      trailingIcon: {
        type: String,
        value: "",
      },
    },
    behaviors: [computedBehavior],
    computed: {
      classes() {
        const ui = this.data.ui;
        const color = this.data.color;
        const size = this.data.size;
        const orientation = this.data.orientation;
        const type = this.data.type;
        const position = this.data.position;

        const theme = dividerTheme({
          color,
          size,
          orientation,
          type,
          position,
        });
        const localClass = this.data.class || this.data.className;
        return resolveSlots(theme, ui, localClass);
      },
      hasContent() {
        return !!(
          this.data.content ||
          this.data.label ||
          this.data.leadingIcon ||
          this.data.trailingIcon
        );
      },
      defaultSlot() {
        return !this.data.label;
      },
    },
  }),
);
