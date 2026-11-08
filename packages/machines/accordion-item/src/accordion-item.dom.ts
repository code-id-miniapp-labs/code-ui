export interface AccordionItemDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  accordionId?: string | undefined;
}

const aidOf = (scope: AccordionItemDomScope, accordionId?: string): string =>
  accordionId || scope.accordionId || scope.id || "d";

export const getRootId = (
  scope: AccordionItemDomScope,
  value: string,
  accordionId?: string,
): string =>
  scope.ids?.item?.(value) ?? `ac-${aidOf(scope, accordionId)}-i-${value}`;

export const getTriggerId = (
  scope: AccordionItemDomScope,
  value: string,
  accordionId?: string,
): string =>
  scope.ids?.trigger?.(value) ?? `ac-${aidOf(scope, accordionId)}-tr-${value}`;

export const getContentId = (
  scope: AccordionItemDomScope,
  value: string,
  accordionId?: string,
): string =>
  scope.ids?.content?.(value) ?? `ac-${aidOf(scope, accordionId)}-c-${value}`;

export const getLabelId = (
  scope: AccordionItemDomScope,
  value: string,
  _accordionId?: string,
): string | undefined => scope.ids?.label?.(value);
