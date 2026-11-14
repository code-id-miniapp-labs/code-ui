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
});

Component(
  createComponentOptions({
    behaviors: [tabsBehavior, computedBehavior],

    properties: createProperties(defaultTabsProps, {
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

      classes() {
        const {
          orientation,
          variant,
          color,
          size,
          disabled,
          fitted,
          ui,
          className,
        } = this.data;

        const themeFns = tabsTheme({
          orientation,
          variant,
          color,
          size,
          disabled,
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
