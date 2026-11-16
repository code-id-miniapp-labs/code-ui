import type { AccordionSize, AccordionVariant } from "@code-ui/accordion";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withAccordionItem } from "@code-ui/miniapp/behaviors/accordion";
import { useComponentIcons } from "../../utils/component-icons";
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
      label: {
        type: String,
        value: "",
      },
      description: {
        type: String,
        value: "",
      },
      icon: {
        type: String,
        value: "",
      },
      trailingIcon: {
        type: String,
        value: "chevronDown",
      },
      size: {
        type: String,
        value: "",
      },
      variant: {
        type: String,
        value: "",
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
      resolvedSize(): AccordionSize {
        return (this.data.size ||
          this.data.groupSize ||
          "md") as AccordionSize;
      },

      resolvedVariant(): AccordionVariant {
        return (this.data.variant ||
          this.data.groupVariant ||
          "outline") as AccordionVariant;
      },

      icons() {
        return useComponentIcons({
          leadingIcon: this.data.icon,
          trailingIcon: this.data.trailingIcon,
          slots: this.data.slots,
        });
      },

      classes() {
        const api = this.data.cAccordionItem;
        const disabled = Boolean(api?.disabled);
        const open = Boolean(api?.isOpen);
        const size = this.data.resolvedSize;
        const variant = this.data.resolvedVariant;
        const ui = this.data.ui;

        const themeFns = accordionItemTheme({
          size,
          variant,
          disabled,
          open,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      measure(this: any) {
        return getApi(this, "cAccordionItem")?.measure?.();
      },
      handleTap(this: any) {
        return getApi(this, "cAccordionItem")?.handleTap?.();
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
