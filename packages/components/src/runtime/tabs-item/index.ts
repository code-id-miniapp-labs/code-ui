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
        const orientation =
          api?.orientation ?? this.data.orientation ?? "horizontal";
        const variant = api?.variant ?? this.data.variant ?? "pill";
        const color = api?.color ?? this.data.color ?? "primary";
        const size = api?.size ?? this.data.size ?? "md";
        const selected = Boolean(api?.isSelected ?? this.data.selected);
        const fitted = Boolean(api?.fitted ?? this.data.fitted);
        const ui = this.data.ui;

        const themeFns = tabsItemTheme({
          orientation,
          variant,
          color,
          size,
          disabled,
          selected,
          fitted,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTap() {
        const api = getApi(this, "tabsItem");
        if (api && !api.isDisabled) {
          api.select();
          this.triggerEvent("select", { value: api.value });
        }
      },
      select() {
        return getApi(this, "tabsItem")?.select?.();
      },
    },
  }),
);
