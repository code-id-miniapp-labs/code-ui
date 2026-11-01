import type { SliderProps } from "./slider.types";

export const defaultSliderProps: SliderProps = {
  disabled: false,
  readOnly: false,
  invalid: false,
  required: false,
  min: 0,
  max: 100,
  step: 1,
  defaultValue: 0,
  orientation: "horizontal",
  inverted: false,
  minStepsBetweenThumbs: 0,
  color: "primary",
  size: "md",
  label: "",
  marks: false,
  formDisabled: false,
  formReadOnly: false,
  fieldDisabled: false,
  fieldSize: "",
  className: "",
  ui: {},
};

