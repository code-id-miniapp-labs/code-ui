import { itemPartId, partId } from "@code-ui/core";

export interface StepperDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
}

const optItemId = (
  scope: StepperDomScope,
  part: string,
  index: number,
): string | undefined => scope.ids?.[part]?.(index);

export const getRootId = (scope: StepperDomScope): string =>
  partId(scope as any, "st", "root", "r");

export const getListId = (scope: StepperDomScope): string =>
  partId(scope as any, "st", "list", "l");

export const getContentId = (scope: StepperDomScope): string =>
  partId(scope as any, "st", "content", "c");

export const getItemId = (scope: StepperDomScope, index: number): string =>
  itemPartId(scope as any, "st", "item", index, "i");

export const getTriggerId = (scope: StepperDomScope, index: number): string =>
  itemPartId(scope as any, "st", "trigger", index, "tr");

export const getIndicatorId = (
  scope: StepperDomScope,
  index: number,
): string | undefined => optItemId(scope, "indicator", index);

export const getSeparatorId = (
  scope: StepperDomScope,
  index: number,
): string | undefined => optItemId(scope, "separator", index);

export const getTitleId = (
  scope: StepperDomScope,
  index: number,
): string | undefined => optItemId(scope, "title", index);

export const getDescriptionId = (
  scope: StepperDomScope,
  index: number,
): string | undefined => optItemId(scope, "description", index);
