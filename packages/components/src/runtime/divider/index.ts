import { computedBehavior, createComponentOptions } from "../_shared/index";
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
        const orientation = this.data.orientation;
        const type = this.data.type;
        const position = this.data.position;

        const theme = dividerTheme({
          color,
          orientation,
          type,
          position,
        });
        return resolveSlots(theme, ui, this.data.className);
      },
      hasContent() {
        return !!(
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
