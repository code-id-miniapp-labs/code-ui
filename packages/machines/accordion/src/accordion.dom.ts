import { itemPartId, partId } from "@code-ui/core";

export interface AccordionDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
}

export const getRootId = (scope: AccordionDomScope): string =>
  partId(scope as any, "ac", "root", "r");

export const getItemId = (
  scope: AccordionDomScope,
  value: string | number,
): string => itemPartId(scope as any, "ac", "item", value, "i");

export const getTriggerId = (
  scope: AccordionDomScope,
  value: string | number,
): string => itemPartId(scope as any, "ac", "trigger", value, "tr");

export const getContentId = (
  scope: AccordionDomScope,
  value: string | number,
): string => itemPartId(scope as any, "ac", "content", value, "c");

export const getLabelId = (
  scope: AccordionDomScope,
  value: string | number,
): string | undefined => scope.ids?.label?.(value);
