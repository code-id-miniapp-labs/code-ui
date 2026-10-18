import type { PinInputProps } from "./pin-input.types";

export const defaultPinInputProps: PinInputProps = {
  value: null,
  invalid: null,
  length: 4,
  type: "numeric",
  variant: "outline",
  color: "primary",
  size: "md",
  highlight: false,
  name: "",
  mask: false,
  placeholder: "",
  disabled: false,
  readOnly: false,
  otp: true,
  autoFocus: false,
  blurOnComplete: false,
  selectOnFocus: false,
  separator: false,
  separatorChar: "-",
  ui: {},
};
