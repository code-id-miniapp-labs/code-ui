import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withAccordion } from "@code-ui/miniapp/behaviors/accordion";
import { resolveSlots } from "../../utils/ui";
import {
  accordionMachine,
  connectAccordion,
  defaultAccordionProps,
} from "@code-ui/accordion";
import themeConfig from "virtual:cui/theme/accordion";
import { tv } from "../../utils/variants";

const accordionTheme = tv(themeConfig);

const accordionBehavior = createMachineBehavior({
  machine: accordionMachine,
  connect: connectAccordion,
  key: "accordion",
  plugins: [withAccordion()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [accordionBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "shared",
      virtualHost: true,
    },

    properties: createProperties(defaultAccordionProps, {
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
        const api = this.data.accordion;
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const variant = api?.variant ?? (this.data.variant || "outline");
        const ui = this.data.ui;

        const themeFns = accordionTheme({
          variant,
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleItemClick(e: WechatMiniprogram.CustomEvent) {
        const val = e.detail?.value ?? e.currentTarget?.dataset?.value;
        if (val !== undefined) {
          getApi(this, "accordion")?.toggle?.(val);
        }
      },
      setValue(val: string | number | (string | number)[]) {
        return getApi(this, "accordion")?.setValue?.(val);
      },
      toggle(val: string | number) {
        return getApi(this, "accordion")?.toggle?.(val);
      },
      expand(val: string | number | (string | number)[]) {
        return getApi(this, "accordion")?.expand?.(val);
      },
      collapse(val: string | number | (string | number)[]) {
        return getApi(this, "accordion")?.collapse?.(val);
      },
      expandAll() {
        return getApi(this, "accordion")?.expandAll?.();
      },
      collapseAll() {
        return getApi(this, "accordion")?.collapseAll?.();
      },
    },
  }),
);

