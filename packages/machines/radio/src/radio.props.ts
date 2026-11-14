import type { RadioResolvedProps } from "./radio.types";

export const defaultRadioProps: RadioResolvedProps = {
  value: "",
  label: "",
  description: "",
  checked: null,
  defaultChecked: false,
  disabled: false,
  readOnly: false,
  invalid: null,
  color: "primary" as const,
  size: "md" as const,
  variant: "outline" as const,
  customIndicator: false,
  ui: {},
};
