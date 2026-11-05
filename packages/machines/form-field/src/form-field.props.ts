import type { FormFieldProps } from "./form-field.types";

export const defaultFormFieldProps: FormFieldProps = {
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
};
