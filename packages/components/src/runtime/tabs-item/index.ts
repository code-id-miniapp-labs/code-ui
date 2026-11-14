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

    properties: createProperties(defaultTabsItemProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.tabsItem;
        const themeFns = tabsItemTheme({
          orientation: api ? api.orientation : this.data.orientation,
          variant: api ? api.variant : this.data.variant,
          color: api ? api.color : this.data.color,
          size: api ? api.size : this.data.size,
          disabled: api ? api.isDisabled : this.data.disabled,
          selected: api ? api.isSelected : Boolean(this.data.selected),
          fitted: api ? api.fitted : this.data.fitted,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleTap() {
        getApi(this, "tabsItem")?.select();
      },
      select() {
        return getApi(this, "tabsItem")?.select();
      },
    },
  }),
);
