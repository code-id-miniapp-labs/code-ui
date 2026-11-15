import type { MiniAppBaseEventLike } from "@code-ui/utils";
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

    slots: {
      default: false,
      leading: false,
      label: false,
      description: false,
      trailing: false,
      content: false,
    },

    properties: createProperties(defaultAccordionItemProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.cAccordionItem;
        const disabled = Boolean(api?.isDisabled ?? this.data.disabled);
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

    methods: {
      measure(this: any) {
        return getApi(this, "cAccordionItem")?.measure?.();
      },
      handleTap(this: any, e: MiniAppBaseEventLike) {
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
