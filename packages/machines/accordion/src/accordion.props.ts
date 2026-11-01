import type { AccordionProps } from "./accordion.types";

export const defaultAccordionProps: AccordionProps = {
  id: undefined,
  ids: undefined,
  component: undefined,
  ui: {},
  value: null,
  defaultValue: null,
  modelValue: null,
  multiple: false,
  collapsible: true,
  disabled: false,
  size: "md",
  variant: "outline",
  items: [],
  linkedCount: 0,
  onChange: undefined,
};
