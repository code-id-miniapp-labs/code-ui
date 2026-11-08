import { itemPartId, optPartId, partId } from "@code-ui/core";

export interface TabsDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
}

export const getRootId = (scope: TabsDomScope): string =>
  partId(scope as any, "tb", "root", "r");

export const getListId = (scope: TabsDomScope): string =>
  partId(scope as any, "tb", "list", "l");

export const getIndicatorId = (scope: TabsDomScope): string | undefined =>
  optPartId(scope as any, "indicator");

export const getTriggerId = (
  scope: TabsDomScope,
  value: string | number,
): string => itemPartId(scope as any, "tb", "trigger", value, "tr");

export const getContentId = (
  scope: TabsDomScope,
  value: string | number,
): string => itemPartId(scope as any, "tb", "content", value, "c");

export const getLeadingId = (
  scope: TabsDomScope,
  value: string | number,
): string | undefined => scope.ids?.leading?.(value);

export const getLabelId = (
  scope: TabsDomScope,
  value: string | number,
): string | undefined => scope.ids?.label?.(value);

export const getTrailingId = (
  scope: TabsDomScope,
  value: string | number,
): string | undefined => scope.ids?.trailing?.(value);
