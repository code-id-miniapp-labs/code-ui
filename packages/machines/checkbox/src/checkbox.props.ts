import type { CheckboxProps } from "./checkbox.types";

export const defaultCheckboxProps: CheckboxProps = {
  checked: null,
  defaultChecked: false,
  indeterminate: null,
  defaultIndeterminate: false,
  disabled: false,
  readOnly: false,
  required: false,
  invalid: null,
  color: "primary" as const,
  size: "md" as const,
  formContext: undefined,
  value: "",
  name: "",
  form: "",
  label: "",
  description: "",
  icon: "check",
  indeterminateIcon: "minus",
  ui: {},
};
