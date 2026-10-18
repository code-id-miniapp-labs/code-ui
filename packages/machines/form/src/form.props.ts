import type { FormProps } from "./form.types";

export const defaultFormProps: FormProps = {
  name: "",
  defaultValue: {},
  rules: {},
  validateOn: ["input", "change", "blur"],
  validateLazy: false,
  focusOnError: true,
  scrollToError: false,
  scrollOffset: 24,
  disabled: false,
  readOnly: false,
  showErrors: false,
  ui: {},
};
