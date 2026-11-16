import type { StepperResolvedProps } from "./stepper.types";

export const defaultStepperProps: StepperResolvedProps = {
  step: null,
  value: null,
  modelValue: null,
  defaultStep: 0,
  count: 0,
  linkedCount: 0,
  linear: false,
  disabled: false,
  items: [],
};
