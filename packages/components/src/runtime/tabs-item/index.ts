import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withTabsItem } from "@code-ui/miniapp/behaviors/tabs";
import { resolveSlots } from "../../utils/ui";
import {
  tabsItemMachine,
  connectTabsItem,
  defaultTabsItemProps,
} from "@code-ui/tabs-item";
import themeConfig from "virtual:cui/theme/tabs-item";
import { tv } from "../../utils/variants";

const tabsItemTheme = tv(themeConfig);

const tabsItemBehavior = createMachineBehavior({
  machine: tabsItemMachine,
  connect: connectTabsItem,
  key: "tabsItem",
  plugins: [withTabsItem()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [tabsItemBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultTabsItemProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.tabsItem;
        const disabled = Boolean(api?.isDisabled ?? this.data.disabled);
        const ui = this.data.ui;

        const themeFns = tabsItemTheme({
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      select() {
        return getApi(this, "tabsItem")?.select?.();
      },
    },
  }),
);

