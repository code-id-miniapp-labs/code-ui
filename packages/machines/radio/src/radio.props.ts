import type { RadioProps } from "./radio.types";

export const defaultRadioProps: RadioProps = {
  value: "",
  label: "",
  description: "",
  checked: null,
  defaultChecked: false,
  disabled: false,
  readOnly: false,
  invalid: null,
  color: "",
  size: undefined,
  variant: "outline" as const,
  customIndicator: false,
  ui: {},
};
