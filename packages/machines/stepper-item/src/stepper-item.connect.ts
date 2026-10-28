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
  const { context, computed, send, scope } = service;

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

  const title = context.get("title") ?? "";
  const description = context.get("description") ?? "";
  const icon = context.get("icon") ?? "";
  const completedIcon = context.get("completedIcon") ?? "";
  const rawVal = context.get("value");
  const value = rawVal !== "" && rawVal !== undefined ? rawVal : resolvedIndex;
  const stepperId = context.get("stepperId") || "";

  const itemProps: Record<string, any> = {
    id: getRootId(scope, resolvedIndex, stepperId),
    "data-scope": "stepper",
    "data-part": "item",
    "data-index": resolvedIndex,
    "data-state": status,
    "data-orientation": orientation,
    "data-disabled": String(isDisabled),
  };

  const triggerProps: Record<string, any> = {
    id: getTriggerId(scope, resolvedIndex, stepperId),
    role: "tab",
    "aria-selected": String(isCurrent),
    "aria-disabled": String(isDisabled),
    "data-scope": "stepper",
    "data-part": "trigger",
    "data-index": resolvedIndex,
    "data-state": status,
    "data-orientation": orientation,
    "data-disabled": String(isDisabled),
    "data-complete": String(isCompleted),
    "data-current": String(isCurrent),
    "data-incomplete": String(isUpcoming),
  };

  const indicatorProps: Record<string, any> = {
    id: getIndicatorId(scope, resolvedIndex, stepperId),
    "aria-hidden": true,
    "data-scope": "stepper",
    "data-part": "indicator",
    "data-index": resolvedIndex,
    "data-state": status,
    "data-complete": String(isCompleted),
    "data-current": String(isCurrent),
    "data-incomplete": String(isUpcoming),
  };

  const separatorProps: Record<string, any> = {
    id: getSeparatorId(scope, resolvedIndex, stepperId),
    role: "separator",
    "aria-orientation": orientation,
    "data-scope": "stepper",
    "data-part": "separator",
    "data-index": resolvedIndex,
    "data-orientation": orientation,
    "data-state": isCompleted ? "completed" : "incomplete",
    "data-complete": String(isCompleted),
  };

  const titleProps: Record<string, any> = {
    id: getTitleId(scope, resolvedIndex, stepperId),
    "data-scope": "stepper",
    "data-part": "title",
    "data-index": resolvedIndex,
    "data-state": status,
  };

  const descriptionProps: Record<string, any> = {
    id: getDescriptionId(scope, resolvedIndex, stepperId),
    "data-scope": "stepper",
    "data-part": "description",
    "data-index": resolvedIndex,
    "data-state": status,
  };

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
    handleTap: () => {
      send({ type: "TAP" });
    },
    itemProps,
    triggerProps,
    indicatorProps,
    separatorProps,
    titleProps,
    descriptionProps,
  };
}
