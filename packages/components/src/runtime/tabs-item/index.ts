import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withTabsItem } from "@code-ui/miniapp/behaviors/tabs";
import { useComponentIcons } from "../../utils/component-icons";
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
    slots: {
      default: false,
      leading: false,
      label: false,
      trailing: false,
    },

    properties: createProperties(defaultTabsItemProps, {
      ui: {
        type: Object,
        value: {},
      },
      mode: {
        type: String,
        value: "auto",
      },
      label: {
        type: String,
        value: "",
      },
      icon: {
        type: String,
        value: "",
      },
      trailingIcon: {
        type: String,
        value: "",
      },
      lazy: {
        type: Boolean,
        value: true,
      },
      orientation: {
        type: String,
        value: "",
      },
      variant: {
        type: String,
        value: "",
      },
      color: {
        type: String,
        value: "",
      },
      size: {
        type: String,
        value: "",
      },
      fitted: {
        type: null,
        value: null,
      },
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      resolvedOrientation() {
        return this.data.orientation || this.data.groupOrientation || "horizontal";
      },

      resolvedVariant() {
        return this.data.variant || this.data.groupVariant || "pill";
      },

      resolvedColor() {
        return this.data.color || this.data.groupColor || "primary";
      },

      resolvedSize() {
        return this.data.size || this.data.groupSize || "md";
      },

      resolvedFitted(): boolean {
        return typeof this.data.fitted === "boolean"
          ? this.data.fitted
          : Boolean(this.data.groupFitted);
      },

      icons() {
        return useComponentIcons({
          leadingIcon: this.data.icon,
          trailingIcon: this.data.trailingIcon,
          slots: this.data.slots,
        });
      },

      classes() {
        const api = this.data.tabsItem;
        const themeFns = tabsItemTheme({
          orientation: this.data.resolvedOrientation,
          variant: this.data.resolvedVariant,
          color: this.data.resolvedColor,
          size: this.data.resolvedSize,
          disabled: Boolean(api?.disabled),
          selected: Boolean(api?.isSelected),
          fitted: this.data.resolvedFitted,
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
