import { computedBehavior, createComponentOptions } from "../_shared/base";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";
import themeConfig from "virtual:cui/theme/badge";

const badgeTheme = tv(themeConfig);

Component(
  createComponentOptions({
    options: {
      virtualHost: true,
      multipleSlots: true,
      styleIsolation: "apply-shared",
    },
    properties: {
      ui: { type: Object, value: {} },
      className: { type: String, value: "" },
      color: { type: String, value: "primary" },
      size: { type: String, value: "md" },
      variant: { type: String, value: "solid" },
      label: { type: String, value: "" },
      leading: { type: Boolean, value: false },
      trailing: { type: Boolean, value: false },
    },
    behaviors: [computedBehavior],
    computed: {
      classes() {
        const ui = this.data.ui;
        const color = this.data.color;
        const size = this.data.size;
        const variant = this.data.variant;

        const theme = badgeTheme({
          color,
          size,
          variant,
        });
        return resolveSlots(theme, ui, this.data.className);
      },
    },
  }),
);
