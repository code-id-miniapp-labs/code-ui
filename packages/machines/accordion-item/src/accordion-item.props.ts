import type { AccordionItemResolvedProps } from "./accordion-item.types";

export const defaultAccordionItemProps: AccordionItemResolvedProps = {
  ui: {},
  value: "",
  label: "",
  description: "",
  content: "",
  icon: "",
  trailingIcon: "chevronDown",
  disabled: false,
  open: null,
  defaultOpen: false,
  size: "",
  variant: "",
  collapsible: true,
  contentHeight: null,
};
