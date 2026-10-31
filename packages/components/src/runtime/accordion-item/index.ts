import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withAccordionItem } from "@code-ui/miniapp/behaviors/accordion";
import { resolveSlots } from "../../utils/ui";
import {
  accordionItemMachine,
  connectAccordionItem,
  defaultAccordionItemProps,
} from "@code-ui/accordion-item";
import themeConfig from "virtual:cui/theme/accordion-item";
import { tv } from "../../utils/variants";

const accordionItemTheme = tv(themeConfig);

const accordionItemBehavior = createMachineBehavior({
  machine: accordionItemMachine,
  connect: connectAccordionItem,
  key: "cAccordionItem",
  plugins: [withAccordionItem()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [accordionItemBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultAccordionItemProps, {
      className: {
        type: String,
        value: "",
      },
      customTrailing: {
        type: Boolean,
        value: false,
      },
      hasLeadingSlot: {
        type: Boolean,
        value: false,
      },
    }),

    computed: {
      classes() {
        const api = this.data.cAccordionItem;
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const size = api?.size ?? (this.data.size || "md");
        const variant = api?.variant ?? (this.data.variant || "outline");
        const ui = this.data.ui;

        const themeFns = accordionItemTheme({
          size,
          variant,
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    lifetimes: {
      ready(this: any) {
        this.measure();
      },
    },

    observers: {
      "cAccordionItem.isOpen": function (this: any, isOpen: boolean) {
        if (isOpen) {
          this.measure();
        }
      },
      content: function (this: any) {
        this.measure();
      },
    },

    methods: {
      measure(this: any) {
        return getApi(this, "cAccordionItem")?.measure?.();
      },
      handleTap(this: any, e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "cAccordionItem")?.handleTap?.(e);
      },
      toggle(this: any) {
        return getApi(this, "cAccordionItem")?.toggle?.();
      },
      open(this: any) {
        return getApi(this, "cAccordionItem")?.open?.();
      },
      close(this: any) {
        return getApi(this, "cAccordionItem")?.close?.();
      },
    },
  }),
);
