import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withTabs } from "@code-ui/miniapp/behaviors/tabs";
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

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

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
        const api = this.data.tabs;
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const orientation = api?.orientation ?? this.data.orientation;
        const variant = api?.variant ?? this.data.variant;
        const color = api?.color ?? this.data.color;
        const size = api?.size ?? this.data.size;
        const ui = this.data.ui;

        const themeFns = tabsTheme({
          orientation,
          variant,
          color,
          size,
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTriggerTap(e: WechatMiniprogram.CustomEvent) {
        const value = e.currentTarget?.dataset?.value;
        if (value !== undefined) {
          getApi(this, "tabs")?.select?.(value);
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

