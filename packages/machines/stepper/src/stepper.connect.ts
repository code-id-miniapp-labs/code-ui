import {
  getContentId,
  getDescriptionId,
  getIndicatorId,
  getItemId,
  getListId,
  getRootId,
  getSeparatorId,
  getTitleId,
  getTriggerId,
} from "./stepper.dom";
import type {
  StepItemComputed,
  StepperApi,
  StepperColor,
  StepperOrientation,
  StepperService,
  StepperSize,
  StepperStatus,
  StepperVariant,
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
  const linear = Boolean(prop("linear"));
  const orientation = (prop("orientation") || "horizontal") as StepperOrientation;
  const color = (prop("color") || "primary") as StepperColor;
  const size = (prop("size") || "md") as StepperSize;
  const variant = (prop("variant") || "subtle") as StepperVariant;
  const disabled = Boolean(prop("disabled"));
  const hasContent = Boolean(prop("hasContent"));
  const rawItems = context.get("items") ?? [];
  const scrollTargetIndex = computed("scrollTargetIndex");
  const scrollIntoViewId = getItemId(scope, scrollTargetIndex);
  const scrollLeft = context.get("scrollLeft") ?? 0;

  const stepMetas = Array.isArray(rawItems)
    ? rawItems.map((item, index) => {
        const isDisabled =
          disabled || Boolean(item?.disabled) || (linear && index > step + 1);
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
        return { item, status, isDisabled, isComplete, isCurrent, isUpcoming };
      })
    : [];

  const getRootProps = (): Record<string, any> => ({
    id: getRootId(scope),
  });

  const getListProps = (): Record<string, any> => ({
    id: getListId(scope),
    "enable-flex": true,
    "scroll-x": orientation === "horizontal",
    "scroll-into-view": scrollIntoViewId,
    "scroll-left": scrollLeft,
    enhanced: true,
    "show-scrollbar": false,
    "scroll-with-animation": true,
  });

  const getContentProps = (
    _props?: { index?: number | undefined } | undefined,
  ): Record<string, any> => ({
    id: getContentId(scope),
  });

  const getItemProps = (props: { index: number }): Record<string, any> => ({
    id: getItemId(scope, props.index),
    "data-index": props.index,
  });

  const getTriggerProps = (props: { index: number }): Record<string, any> => ({
    id: getTriggerId(scope, props.index),
    "data-index": props.index,
  });

  const getIndicatorProps = (props: { index: number }): Record<string, any> => {
    const id = getIndicatorId(scope, props.index);
    return id ? { id, "data-index": props.index } : { "data-index": props.index };
  };

  const getSeparatorProps = (props: { index: number }): Record<string, any> => {
    const id = getSeparatorId(scope, props.index);
    return id ? { id, "data-index": props.index } : { "data-index": props.index };
  };

  const getTitleProps = (props: { index: number }): Record<string, any> => {
    const id = getTitleId(scope, props.index);
    return id ? { id, "data-index": props.index } : { "data-index": props.index };
  };

  const getDescriptionProps = (props: {
    index: number;
  }): Record<string, any> => {
    const id = getDescriptionId(scope, props.index);
    return id ? { id, "data-index": props.index } : { "data-index": props.index };
  };

  const steps: StepItemComputed[] = stepMetas.map((m, index) => {
    const item = m.item;
    return {
      index,
      value: item?.value !== undefined ? item.value : index,
      title: item?.title ?? "",
      description: item?.description ?? "",
      icon: item?.icon ?? "",
      completedIcon: item?.completedIcon ?? "",
      status: m.status,
      isCurrent: m.isCurrent,
      isCompleted: m.isComplete,
      isUpcoming: m.isUpcoming,
      isDisabled: m.isDisabled,
      isFirst: index === 0,
      isLast: index === stepMetas.length - 1,
      ...(item?.ui ? { ui: item.ui } : {}),
      itemProps: getItemProps({ index }),
      triggerProps: getTriggerProps({ index }),
      indicatorProps: getIndicatorProps({ index }),
      separatorProps: getSeparatorProps({ index }),
      titleProps: getTitleProps({ index }),
      descriptionProps: getDescriptionProps({ index }),
      contentProps: hasContent ? getContentProps({ index }) : undefined,
    };
  });

  const currentItem = Array.isArray(rawItems) ? rawItems[step] : undefined;
  const currentValue =
    currentItem?.value !== undefined ? currentItem.value : step;

  const setStep = (index: number) => {
    if (index !== undefined && index !== null) {
      send({ type: "STEP.SET", step: Number(index) });
    }
  };

  const nextStep = () => send({ type: "STEP.NEXT" });
  const prevStep = () => send({ type: "STEP.PREV" });
  const resetStep = () => send({ type: "STEP.RESET" });
  const completeStep = () => setStep(totalCount);
  const scrollTo = (index: number) =>
    send({ type: "STEP.SCROLL_TO", index: Number(index) });

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
    linear,
    orientation,
    color,
    size,
    variant,
    disabled,
    hasContent,
    steps,
    scrollTargetIndex,
    scrollIntoViewId,
    scrollLeft,
    setStep,
    goToStep: setStep,
    nextStep,
    prevStep,
    resetStep,
    completeStep,
    complete: completeStep,
    scrollTo,
    scrollToStep: scrollTo,
    clear: resetStep,
    reset: resetStep,
    rootProps: getRootProps(),
    listProps: getListProps(),
    contentProps: getContentProps(),
    getRootProps,
    getListProps,
    getContentProps,
    getTriggerProps,
    getIndicatorProps,
    getSeparatorProps,
    getTitleProps,
    getDescriptionProps,
  };
}
