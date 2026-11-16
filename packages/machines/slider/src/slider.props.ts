import type { SliderResolvedProps } from "./slider.types";

export const defaultSliderProps: SliderResolvedProps = {
  formContext: undefined,
  value: null,
  defaultValue: null,
  name: "",
  form: "",
  disabled: false,
  readOnly: false,
  invalid: false,
  required: false,
  min: 0,
  max: 100,
  step: 1,
  orientation: "horizontal",
  inverted: false,
  minStepsBetweenThumbs: 0,
  marks: false,
  fieldDisabled: false,
};
