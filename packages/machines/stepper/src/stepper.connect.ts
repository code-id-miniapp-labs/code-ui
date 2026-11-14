import {
  getContentId,
  getItemId,
  getListId,
  getRootId,
} from "./stepper.dom";
import type {
  StepItemComputed,
  StepperApi,
  StepperService,
  StepperStatus,
} from "./stepper.types";

export function connectStepper(service: StepperService): StepperApi {
  const { state, context, computed, prop, send, scope } = service;

  const step = context.get("step");
  const totalCount = computed("totalCount");
  const percent = computed("percent");
  const hasNext = computed("hasNext");
  const hasPrev = computed("hasPrev");
  const isFirst = computed("isFirst");
  const isLast = computed("isLast");
  const isCompleted = computed("isCompleted");
  const linear = prop("linear");
  const orientation = prop("orientation");
  const disabled = prop("disabled");
  const fallbackUi = prop("ui");
  const rawItems = context.get("items");
  const scrollTargetIndex = computed("scrollTargetIndex");
  const scrollIntoViewId = computed("scrollIntoViewId");

  const getRootProps = (): Record<string, any> => ({
    id: getRootId(scope),
  });

  const getListProps = (): Record<string, any> => ({
    id: getListId(scope),
    "enable-flex": true,
    "scroll-x": orientation === "horizontal",
    "scroll-into-view": scrollIntoViewId,
    enhanced: true,
    "show-scrollbar": false,
    "scroll-with-animation": true,
  });

  const getContentProps = (
    _props?: { index?: number | undefined } | undefined,
  ): Record<string, any> => ({
    id: getContentId(scope),
  });

  const steps: StepItemComputed[] = Array.isArray(rawItems)
    ? rawItems.map((item, index) => {
        const isDisabled =
          disabled || Boolean(item.disabled) || (linear && index > step + 1);
        const isComplete =
          index < step || (totalCount > 0 && step >= totalCount);
        const isCurrent =
          index === step && (totalCount <= 0 || step < totalCount);
        const isUpcoming =
          index > step && (totalCount <= 0 || step < totalCount);
        const status: StepperStatus = isDisabled
          ? "disabled"
          : isComplete
            ? "completed"
            : isCurrent
              ? "current"
              : "upcoming";

        return {
          index,
          value: item.value !== undefined ? item.value : index,
          title: item.title ?? "",
          description: item.description ?? "",
          icon: item.icon ?? "",
          completedIcon: item.completedIcon ?? "",
          status,
          isCurrent,
          isCompleted: isComplete,
          isUpcoming,
          isDisabled,
          isFirst: index === 0,
          isLast: index === rawItems.length - 1,
          ui: item.ui ?? fallbackUi,
          itemProps: { id: getItemId(scope, index), "data-index": index },
        };
      })
    : [];

  const currentItem = Array.isArray(rawItems) ? rawItems[step] : undefined;
  const currentValue =
    currentItem?.value !== undefined ? currentItem.value : step;

  return {
    state: state.get(),
    step,
    value: currentValue,
    count: totalCount,
    percent,
    hasNext,
    hasPrev,
    isFirst,
    isLast,
    isCompleted,
    steps,
    scrollTargetIndex,
    scrollIntoViewId,
    setStep: (index: number) => send({ type: "STEP.SET", step: index }),
    nextStep: () => send({ type: "STEP.NEXT" }),
    prevStep: () => send({ type: "STEP.PREV" }),
    resetStep: () => send({ type: "STEP.RESET" }),
    completeStep: () => send({ type: "STEP.COMPLETE" }),
    scrollTo: (index: number) => send({ type: "STEP.SCROLL_TO", index }),
    rootProps: getRootProps(),
    listProps: getListProps(),
    contentProps: getContentProps(),
    getRootProps,
    getListProps,
    getContentProps,
  };
}
