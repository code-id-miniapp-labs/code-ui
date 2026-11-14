import { isNotNull } from "@code-ui/utils";
import type { PropFn } from "@code-ui/core";
import type { StepperSchema } from "./stepper.types";

export function clampValue(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function resolveControlledStep(
  prop: PropFn<StepperSchema>,
): number | undefined {
  const rawStep = prop("step");
  if (isNotNull(rawStep)) {
    return Number(rawStep);
  }
  const rawValue = prop("value");
  if (isNotNull(rawValue)) {
    return Number(rawValue);
  }
  const rawModelValue = prop("modelValue");
  if (isNotNull(rawModelValue)) {
    return Number(rawModelValue);
  }
  return undefined;
}
