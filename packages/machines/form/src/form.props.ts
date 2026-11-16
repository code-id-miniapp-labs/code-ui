import type { FormResolvedProps } from "./form.types";

export const defaultFormProps: FormResolvedProps = {
  name: "",
  value: null,
  defaultValue: {},
  rules: {},
  validateOn: ["input", "change", "blur"],
  validateLazy: false,
  focusOnError: true,
  scrollToError: false,
  scrollOffset: 24,
  disabled: false,
  readOnly: false,
};
