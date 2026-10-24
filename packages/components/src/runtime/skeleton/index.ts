import { computedBehavior, createComponentOptions } from "../_shared";
import { resolveSlots } from "../../utils/ui";
import { tv } from "../../utils/variants";
import themeConfig from "virtual:cui/theme/skeleton";

const skeletonTheme = tv(themeConfig);

Component(
  createComponentOptions({
    options: {
      styleIsolation: "apply-shared",
      virtualHost: true,
    },
    properties: {
      ui: { type: Object, value: {} },
      className: { type: String, value: "" },
      variant: { type: String, value: "pulse" },
    },
    behaviors: [computedBehavior],
    computed: {
      classes() {
        const ui = this.data.ui;
        const variant = this.data.variant;

        const theme = skeletonTheme({
          variant,
        });
        return resolveSlots(theme, ui, this.data.className);
      },
    },
  }),
);
