import type { CheckboxResolvedProps } from "./checkbox.types";

export const defaultCheckboxProps: CheckboxResolvedProps = {
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
  variant: "outline" as const,
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
