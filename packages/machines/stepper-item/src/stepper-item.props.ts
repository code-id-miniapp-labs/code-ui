import type { StepperItemResolvedProps } from "./stepper-item.types";

export const defaultStepperItemProps: StepperItemResolvedProps = {
  stepperId: "",
  index: null,
  isLast: null,
  title: "",
  description: "",
  icon: "",
  completedIcon: "check",
  disabled: false,
  completed: null,
  status: "",
  value: "",
  orientation: "",
  color: "",
  size: "",
  variant: "",
  ui: {},
};
