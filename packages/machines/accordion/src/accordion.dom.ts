export interface AccordionDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
}

export const getRootId = (scope: AccordionDomScope): string =>
  scope.ids?.root ?? `cui-accordion-${scope.id ?? "root"}`;

export const getItemId = (
  scope: AccordionDomScope,
  value: string | number,
): string =>
  scope.ids?.item?.(value) ?? `cui-accordion-${scope.id ?? "root"}-item-${value}`;

export const getTriggerId = (
  scope: AccordionDomScope,
  value: string | number,
): string =>
  scope.ids?.trigger?.(value) ??
  `cui-accordion-${scope.id ?? "root"}-trigger-${value}`;

export const getContentId = (
  scope: AccordionDomScope,
  value: string | number,
): string =>
  scope.ids?.content?.(value) ??
  `cui-accordion-${scope.id ?? "root"}-content-${value}`;

export const getLabelId = (
  scope: AccordionDomScope,
  value: string | number,
): string =>
  scope.ids?.label?.(value) ?? `cui-accordion-${scope.id ?? "root"}-label-${value}`;

