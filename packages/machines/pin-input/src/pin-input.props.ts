import type { PinInputProps } from "./pin-input.types";

export const defaultPinInputProps: PinInputProps = {
  length: 4,
  type: "numeric",
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
