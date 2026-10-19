import type { SwitchProps } from "./switch.types";

export const defaultSwitchProps: SwitchProps = {
  checked: null,
  defaultChecked: false,
  disabled: false,
  readOnly: false,
  required: false,
  invalid: null,
  loading: false,
  color: "primary",
  size: "md",
  value: "on",
  name: "",
  form: "",
  label: "",
  description: "",
  checkedIcon: "",
  uncheckedIcon: "",
  loadingIcon: "",
  fieldDisabled: false,
  fieldSize: undefined,
  ui: {},
};
