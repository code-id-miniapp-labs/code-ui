import type { SwitchResolvedProps } from "./switch.types";

export const defaultSwitchProps: SwitchResolvedProps = {
  checked: null,
  defaultChecked: false,
  disabled: false,
  readOnly: false,
  required: false,
  invalid: null,
  loading: false,
  color: "primary" as const,
  size: "md" as const,
  formContext: undefined,
  value: "on",
  name: "",
  form: "",
  label: "",
  description: "",
  checkedIcon: "",
  uncheckedIcon: "",
  loadingIcon: "loading",
  ui: {},
};
