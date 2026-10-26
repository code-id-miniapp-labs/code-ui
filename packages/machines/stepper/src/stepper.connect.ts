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
  StepperService,
  StepperStatus,
} from "./stepper.types";

export function connectStepper(service: StepperService): StepperApi {
  const { state, context, computed, send, scope } = service;

  const step = context.get("step");
  const totalCount = computed("totalCount");
  const percent = computed("percent");
  const hasNext = computed("hasNext");
  const hasPrev = computed("hasPrev");
  const isFirst = computed("isFirst");
  const isLast = computed("isLast");
  const isCompleted = computed("isCompleted");
  const linear = Boolean(context.get("linear"));
  const orientation = context.get("orientation") || "horizontal";
  const color = context.get("color") || "primary";
  const size = context.get("size") || "md";
  const variant = context.get("variant") || "subtle";
  const disabled = Boolean(context.get("disabled"));
  const hasContent = Boolean(context.get("hasContent"));
  const rawItems = context.get("items") ?? [];
  const scrollTargetIndex = computed("scrollTargetIndex");
  const scrollIntoViewId = getItemId(scope, scrollTargetIndex);
  const scrollLeft = context.get("scrollLeft") ?? 0;

  const getStepStatus = (
    index: number,
    itemDisabled?: boolean | undefined,
  ): StepperStatus => {
    const isItemDisabled =
      disabled || Boolean(itemDisabled) || (linear && index > step + 1);
    if (isItemDisabled) return "disabled";
    if (index < step || (totalCount > 0 && step >= totalCount))
      return "completed";
    if (index === step) return "current";
    return "upcoming";
  };

  const getRootProps = (): Record<string, any> => ({
    id: getRootId(scope),
    "data-scope": "stepper",
    "data-part": "root",
    "data-orientation": orientation,
    "data-disabled": disabled,
  });

  const getListProps = (): Record<string, any> => ({
    id: getListId(scope),
    role: "tablist",
    "aria-orientation": orientation,
    "data-scope": "stepper",
    "data-part": "list",
    "data-orientation": orientation,
    "scroll-x": orientation === "horizontal",
    "scroll-y": orientation === "vertical",
    "enable-flex": true,
    enhanced: true,
    "show-scrollbar": false,
    "scroll-with-animation": true,
    "scroll-into-view": scrollIntoViewId,
    "scroll-left": scrollLeft,
  });

  const getContentProps = (
    props?: { index?: number | undefined } | undefined,
  ): Record<string, any> => {
    const idx = props?.index ?? step;
    const isSelected = idx === step;
    return {
      id: getContentId(scope),
      role: "tabpanel",
      hidden: !isSelected,
      "data-scope": "stepper",
      "data-part": "content",
      "data-state": isSelected ? "open" : "closed",
      "data-orientation": orientation,
    };
  };

  const getItemProps = (props: { index: number }): Record<string, any> => {
    const { index } = props;
    const item = Array.isArray(rawItems) ? rawItems[index] : undefined;
    const status = getStepStatus(index, item?.disabled);
    const isItemDisabled = status === "disabled";
    return {
      id: getItemId(scope, index),
      "data-scope": "stepper",
      "data-part": "item",
      "data-index": index,
      "data-state": status,
      "data-orientation": orientation,
      "data-disabled": isItemDisabled,
    };
  };

  const getTriggerProps = (props: { index: number }): Record<string, any> => {
    const { index } = props;
    const item = Array.isArray(rawItems) ? rawItems[index] : undefined;
    const status = getStepStatus(index, item?.disabled);
    const isItemDisabled = status === "disabled";
    const isCurrent = index === step && (totalCount <= 0 || step < totalCount);
    const isComplete = index < step || (totalCount > 0 && step >= totalCount);
    return {
      id: getTriggerId(scope, index),
      role: "tab",
      "aria-selected": isCurrent,
      "aria-disabled": isItemDisabled,
      "data-scope": "stepper",
      "data-part": "trigger",
      "data-index": index,
      "data-state": status,
      "data-orientation": orientation,
      "data-disabled": isItemDisabled,
      "data-complete": isComplete,
      "data-current": isCurrent,
      "data-incomplete": index > step && (totalCount <= 0 || step < totalCount),
    };
  };

  const getIndicatorProps = (props: { index: number }): Record<string, any> => {
    const { index } = props;
    const item = Array.isArray(rawItems) ? rawItems[index] : undefined;
    const status = getStepStatus(index, item?.disabled);
    const isCurrent = index === step && (totalCount <= 0 || step < totalCount);
    const isComplete = index < step || (totalCount > 0 && step >= totalCount);
    return {
      id: getIndicatorId(scope, index),
      "aria-hidden": true,
      "data-scope": "stepper",
      "data-part": "indicator",
      "data-index": index,
      "data-state": status,
      "data-complete": isComplete,
      "data-current": isCurrent,
      "data-incomplete": index > step && (totalCount <= 0 || step < totalCount),
    };
  };

  const getSeparatorProps = (props: { index: number }): Record<string, any> => {
    const { index } = props;
    const isStepCompleted =
      index < step || (totalCount > 0 && step >= totalCount);
    return {
      id: getSeparatorId(scope, index),
      role: "separator",
      "aria-orientation": orientation,
      "data-scope": "stepper",
      "data-part": "separator",
      "data-index": index,
      "data-orientation": orientation,
      "data-state": isStepCompleted ? "completed" : "incomplete",
      "data-complete": isStepCompleted,
    };
  };

  const getTitleProps = (props: { index: number }): Record<string, any> => {
    const { index } = props;
    const item = Array.isArray(rawItems) ? rawItems[index] : undefined;
    const status = getStepStatus(index, item?.disabled);
    return {
      id: getTitleId(scope, index),
      "data-scope": "stepper",
      "data-part": "title",
      "data-index": index,
      "data-state": status,
    };
  };

  const getDescriptionProps = (props: {
    index: number;
  }): Record<string, any> => {
    const { index } = props;
    const item = Array.isArray(rawItems) ? rawItems[index] : undefined;
    const status = getStepStatus(index, item?.disabled);
    return {
      id: getDescriptionId(scope, index),
      "data-scope": "stepper",
      "data-part": "description",
      "data-index": index,
      "data-state": status,
    };
  };

  const steps: StepItemComputed[] = Array.isArray(rawItems)
    ? rawItems.map((item, index) => {
        const status = getStepStatus(index, item?.disabled);
        const isCurrentStep =
          index === step && (totalCount <= 0 || step < totalCount);
        const isCompletedStep =
          index < step || (totalCount > 0 && step >= totalCount);
        const isUpcomingStep =
          index > step && (totalCount <= 0 || step < totalCount);
        const isDisabledStep = status === "disabled";
        return {
          index,
          value: item?.value !== undefined ? item.value : index,
          title: item?.title ?? "",
          description: item?.description ?? "",
          icon: item?.icon ?? "",
          status,
          isCurrent: isCurrentStep,
          isCompleted: isCompletedStep,
          isUpcoming: isUpcomingStep,
          isDisabled: isDisabledStep,
          isFirst: index === 0,
          isLast: index === rawItems.length - 1,
          ...(item?.ui ? { ui: item.ui } : {}),
          itemProps: getItemProps({ index }),
          triggerProps: getTriggerProps({ index }),
          indicatorProps: getIndicatorProps({ index }),
          separatorProps: getSeparatorProps({ index }),
          titleProps: getTitleProps({ index }),
          descriptionProps: getDescriptionProps({ index }),
        };
      })
    : [];

  const currentItem = Array.isArray(rawItems) ? rawItems[step] : undefined;
  const currentValue =
    currentItem?.value !== undefined ? currentItem.value : step;

  const setStep = (index: number) => {
    if (index !== undefined && index !== null) {
      send({ type: "STEP.SET", step: Number(index) });
    }
  };

  const nextStep = () => {
    send({ type: "STEP.NEXT" });
  };

  const prevStep = () => {
    send({ type: "STEP.PREV" });
  };

  const resetStep = () => {
    send({ type: "STEP.RESET" });
  };

  const completeStep = () => {
    setStep(totalCount);
  };

  const scrollTo = (index: number) => {
    send({ type: "STEP.SCROLL_TO", index: Number(index) });
  };

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
    getItemProps,
    getTriggerProps,
    getIndicatorProps,
    getSeparatorProps,
    getTitleProps,
    getDescriptionProps,
  };
}
