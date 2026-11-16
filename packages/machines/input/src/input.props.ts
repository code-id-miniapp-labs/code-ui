import type { InputResolvedProps } from "./input.types";

export const defaultInputProps: InputResolvedProps = {
  value: null,
  invalid: null,
  defaultValue: "",
  name: "",
  disabled: false,
  readOnly: false,
  clearable: false,
  autoFocus: false,
};
