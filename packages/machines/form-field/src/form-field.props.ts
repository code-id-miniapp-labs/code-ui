import type { FormFieldResolvedProps } from "./form-field.types";

export const defaultFormFieldProps: FormFieldResolvedProps = {
  formContext: undefined,
  name: "",
  form: "",
  label: "",
  error: "",
  required: false,
  disabled: false,
  rules: [],
};
