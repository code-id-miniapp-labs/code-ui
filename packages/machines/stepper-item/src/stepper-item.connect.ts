import {
  getDescriptionId,
  getIndicatorId,
  getRootId,
  getSeparatorId,
  getTitleId,
  getTriggerId,
} from "./stepper-item.dom";
import type { StepperItemApi, StepperItemService } from "./stepper-item.types";

export function connectStepperItem(
  service: StepperItemService,
): StepperItemApi {
  const { computed, prop, send, scope } = service;

  const resolvedIndex = computed("resolvedIndex");
  const resolvedIsLast = computed("resolvedIsLast");
  const isCompleted = computed("isCompleted");
  const isCurrent = computed("isCurrent");
  const isUpcoming = computed("isUpcoming");
  const isDisabled = computed("isDisabled");
  const status = computed("status");
  const orientation = computed("effectiveOrientation");
  const color = computed("effectiveColor");
  const size = computed("effectiveSize");
  const variant = computed("effectiveVariant");

  const title = prop("title") ?? "";
  const description = prop("description") ?? "";
  const icon = prop("icon") ?? "";
  const completedIcon = prop("completedIcon") ?? "";
  const rawVal = prop("value");
  const value = rawVal !== "" && rawVal !== undefined ? rawVal : resolvedIndex;
  const stepperId = prop("stepperId") || "";

  const indId = getIndicatorId(scope, resolvedIndex, stepperId);
  const sepId = getSeparatorId(scope, resolvedIndex, stepperId);
  const titleId = getTitleId(scope, resolvedIndex, stepperId);
  const descId = getDescriptionId(scope, resolvedIndex, stepperId);

  const itemProps: Record<string, any> = {
    id: getRootId(scope, resolvedIndex, stepperId),
  };

  const triggerProps: Record<string, any> = {
    id: getTriggerId(scope, resolvedIndex, stepperId),
  };

  const indicatorProps: Record<string, any> = indId ? { id: indId } : {};
  const separatorProps: Record<string, any> = sepId ? { id: sepId } : {};
  const titleProps: Record<string, any> = titleId ? { id: titleId } : {};
  const descriptionProps: Record<string, any> = descId ? { id: descId } : {};

  return {
    stepperId,
    index: resolvedIndex,
    resolvedIndex,
    resolvedIsLast,
    title,
    description,
    icon,
    completedIcon,
    value,
    status,
    isCompleted,
    isCurrent,
    isUpcoming,
    isDisabled,
    disabled: isDisabled,
    orientation,
    color,
    size,
    variant,
    handleTap: () => send({ type: "TAP" }),
    itemProps,
    triggerProps,
    indicatorProps,
    separatorProps,
    titleProps,
    descriptionProps,
  };
}
