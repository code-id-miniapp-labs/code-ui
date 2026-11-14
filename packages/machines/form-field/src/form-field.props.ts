import type { FormFieldResolvedProps } from "./form-field.types";

export const defaultFormFieldProps: FormFieldResolvedProps = {
  formContext: undefined,
  name: "",
  form: "",
  label: "",
  description: "",
  help: "",
  helperText: "",
  hint: "",
  error: "",
  required: false,
  disabled: false,
  rules: [],
  size: "md",
  ui: {},
};
