import { getRootId, getTriggerId } from "./stepper-item.dom";
import type { StepperItemApi, StepperItemService } from "./stepper-item.types";

export function connectStepperItem(
  service: StepperItemService,
): StepperItemApi {
  const { state, computed, prop, send, scope } = service;

  const index = computed("resolvedIndex");
  const isLast = computed("resolvedIsLast");
  const isCompleted = computed("isCompleted");
  const isCurrent = computed("isCurrent");
  const isUpcoming = computed("isUpcoming");
  const disabled = computed("isDisabled");
  const status = computed("status");

  const rawVal = prop("value");
  const value = rawVal !== "" ? rawVal : index;
  const stepperId = prop("stepperId");

  return {
    state: state.get(),
    index,
    isLast,
    value,
    status,
    isCompleted,
    isCurrent,
    isUpcoming,
    disabled,
    handleTap: () => send({ type: "TAP" }),
    itemProps: {
      id: getRootId(scope, index, stepperId),
    },
    triggerProps: {
      id: getTriggerId(scope, index, stepperId),
    },
  };
}
