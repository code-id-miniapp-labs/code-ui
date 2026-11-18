import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withTabs } from "@code-ui/miniapp/behaviors/tabs";
import type { MiniAppEventLike } from "@code-ui/utils";
import { resolveSlots } from "../../utils/ui";
import {
  tabsMachine,
  connectTabs,
  defaultTabsProps,
} from "@code-ui/tabs";
import themeConfig from "virtual:cui/theme/tabs";
import { tv } from "../../utils/variants";

const tabsTheme = tv(themeConfig);

const tabsBehavior = createMachineBehavior({
  machine: tabsMachine,
  connect: connectTabs,
  key: "tabs",
  plugins: [withTabs()],
  exportApi: true,
  exportApiKeys: [
    "value",
    "selectedIndex",
    "setValue",
    "select",
    "selectNext",
    "selectPrev",
    "selectFirst",
    "selectLast",
  ],
});

Component(
  createComponentOptions({
    behaviors: [tabsBehavior, computedBehavior],
    slots: {
      default: false,
      listTrailing: false,
    },

    properties: createProperties(defaultTabsProps, {
      orientation: {
        type: String,
        value: "horizontal",
      },
      variant: {
        type: String,
        value: "pill",
      },
      color: {
        type: String,
        value: "primary",
      },
      size: {
        type: String,
        value: "md",
      },
      fitted: {
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
    }),

    computed: {
      hasItems() {
        const items = this.data.items;
        return Array.isArray(items) && items.length > 0;
      },

      resolvedItems() {
        const items = this.data.tabs?.items;
        if (!Array.isArray(items)) return [];
        const rawItems =
          Array.isArray(this.data.items) && this.data.items.length > 0
            ? this.data.items
            : this.data.childVisualItems;
        const fallbackUi = this.data.ui;
        return items.map((item: any, idx: number) => {
          const raw = Array.isArray(rawItems) ? rawItems[idx] : undefined;
          const rawObj = raw && typeof raw === "object" ? raw : undefined;
          return {
            ...item,
            label:
              typeof raw === "string"
                ? raw
                : (rawObj?.label ?? String(item.value)),
            icon: rawObj?.icon,
            trailingIcon: rawObj?.trailingIcon,
            content: rawObj?.content,
            slot: rawObj?.slot,
            ui: rawObj?.ui ?? fallbackUi,
          };
        });
      },

      classes() {
        const {
          orientation,
          variant,
          color,
          size,
          fitted,
          ui,
          className,
        } = this.data;

        const themeFns = tabsTheme({
          orientation,
          variant,
          color,
          size,
          disabled: Boolean(this.data.tabs?.disabled),
          fitted,
        });

        return resolveSlots(themeFns, ui, className);
      },
    },

    methods: {
      handleItemSelect(e: MiniAppEventLike<{ value?: string | number }>) {
        if (e.detail.value !== undefined) {
          getApi(this, "tabs")?.select(e.detail.value);
        }
      },

      select(value: string | number) {
        return getApi(this, "tabs")?.select?.(value);
      },
      setValue(value: string | number) {
        return getApi(this, "tabs")?.setValue?.(value);
      },
      selectNext() {
        return getApi(this, "tabs")?.selectNext?.();
      },
      selectPrev() {
        return getApi(this, "tabs")?.selectPrev?.();
      },
      selectFirst() {
        return getApi(this, "tabs")?.selectFirst?.();
      },
      selectLast() {
        return getApi(this, "tabs")?.selectLast?.();
      },
    },
  }),
);
