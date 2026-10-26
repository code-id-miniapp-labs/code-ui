import { computedBehavior, createComponentOptions } from "../_shared/base";
import { resolveSlots } from "../../utils/ui";
import { getIcon } from "@code-ui/core";
import themeConfig from "virtual:cui/theme/icon";
import { tv } from "../../utils/variants";

const iconTheme = tv(themeConfig);

const PATH_RE =
  /^(?:\/|\.\.?\/|https?:\/\/|data:image\/)|\.(?:svg|png|jpe?g|webp|gif)$/i;

Component(
  createComponentOptions({
    behaviors: [computedBehavior],

    options: {
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: {
      name: {
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
      resolvedName() {
        const raw = this.data.name;
        if (!raw) return "";
        return getIcon(raw) || raw;
      },
      isPath() {
        return PATH_RE.test(this.data.resolvedName);
      },
      classes() {
        const theme = iconTheme();
        return resolveSlots(theme, this.data.ui, this.data.className);
      },
    },
  }),
);
