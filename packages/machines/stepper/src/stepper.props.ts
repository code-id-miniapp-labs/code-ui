import type { StepperProps } from "./stepper.types";

export const defaultStepperProps: StepperProps = {
  step: null,
  value: null,
  modelValue: null,
  defaultStep: 0,
  count: 0,
  linkedCount: 0,
  linear: false,
  orientation: "horizontal",
  color: "primary",
  size: "md",
  variant: "subtle",
  disabled: false,
  hasContent: false,
  items: [],
  ui: {},
};
