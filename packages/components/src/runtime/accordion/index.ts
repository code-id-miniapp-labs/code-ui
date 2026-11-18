import type { MiniAppEventLike } from "@code-ui/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
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
  exportApiKeys: [
    "value",
    "setValue",
    "toggle",
    "expand",
    "collapse",
    "expandAll",
    "collapseAll",
    "isOpen",
  ],
});

Component(
  createComponentOptions({
    behaviors: [accordionBehavior, computedBehavior],

    slots: {
      default: false,
    },

    properties: createProperties(defaultAccordionProps, {
      size: {
        type: String,
        value: "md",
      },
      variant: {
        type: String,
        value: "outline",
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
        const apiItems = this.data.accordion?.items ?? [];
        const rawItems = this.data.items ?? [];
        const fallbackUi = this.data.ui || {};

        return apiItems.map((apiItem: any, idx: number) => {
          const item = rawItems[idx] ?? {};
          return {
            ...apiItem,
            label: item.label ?? "",
            description: item.description ?? "",
            content: item.content ?? "",
            icon: item.icon ?? "",
            trailingIcon: item.trailingIcon ?? "chevronDown",
            ui: item.ui || fallbackUi,
          };
        });
      },

      classes() {
        const disabled = Boolean(this.data.accordion?.disabled);
        const variant = this.data.variant;
        const ui = this.data.ui;

        const themeFns = accordionTheme({
          variant,
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleItemClick(e: MiniAppEventLike<{ value?: string | number }>) {
        if (e?.detail?.value !== undefined) {
          getApi(this, "accordion")?.toggle?.(e.detail.value);
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
