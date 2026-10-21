import type { CheckboxGroupProps } from "./checkbox-group.types";

export const defaultCheckboxGroupProps: CheckboxGroupProps = {
  value: null,
  defaultValue: [],
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
  min: null,
  max: null,
  items: [],
  ui: {},
};
