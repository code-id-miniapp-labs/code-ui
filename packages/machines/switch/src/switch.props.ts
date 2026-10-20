import type { SwitchProps } from "./switch.types";

export const defaultSwitchProps: SwitchProps = {
  checked: null,
  defaultChecked: false,
  disabled: false,
  readOnly: false,
  required: false,
  invalid: null,
  loading: false,
  color: "primary" as const,
  size: "md" as const,
  value: "on",
  name: "",
  form: "",
  label: "",
  description: "",
  checkedIcon: "",
  uncheckedIcon: "",
  loadingIcon: "",
  ui: {},
};
