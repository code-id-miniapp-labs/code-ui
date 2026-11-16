import type { PinInputResolvedProps } from "./pin-input.types";

export const defaultPinInputProps: PinInputResolvedProps = {
  value: null,
  invalid: null,
  length: 4,
  type: "numeric",
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
};
