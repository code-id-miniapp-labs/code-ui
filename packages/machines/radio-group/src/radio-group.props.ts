import type { RadioGroupProps } from "./radio-group.types";

export const defaultRadioGroupProps: RadioGroupProps = {
  value: null,
  defaultValue: null,
  disabled: false,
  readOnly: false,
  required: false,
  invalid: null,
  color: "primary" as const,
  size: "md" as const,
  orientation: "vertical" as const,
  variant: "outline" as const,
  name: "",
  form: "",
  legend: "",
  items: [],
  ui: {},
};
