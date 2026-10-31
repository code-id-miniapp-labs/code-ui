export interface AccordionItemDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  accordionId?: string | undefined;
}

export const getRootId = (
  scope: AccordionItemDomScope,
  value: string,
  accordionId?: string,
): string => {
  const aid = accordionId || scope.accordionId || scope.id || "root";
  return (
    scope.ids?.item?.(value) ?? `cui-accordion-${aid}-item-${value}`
  );
};

export const getTriggerId = (
  scope: AccordionItemDomScope,
  value: string,
  accordionId?: string,
): string => {
  const aid = accordionId || scope.accordionId || scope.id || "root";
  return (
    scope.ids?.trigger?.(value) ??
    `cui-accordion-${aid}-trigger-${value}`
  );
};

export const getContentId = (
  scope: AccordionItemDomScope,
  value: string,
  accordionId?: string,
): string => {
  const aid = accordionId || scope.accordionId || scope.id || "root";
  return (
    scope.ids?.content?.(value) ??
    `cui-accordion-${aid}-content-${value}`
  );
};

export const getLabelId = (
  scope: AccordionItemDomScope,
  value: string,
  accordionId?: string,
): string => {
  const aid = accordionId || scope.accordionId || scope.id || "root";
  return (
    scope.ids?.label?.(value) ?? `cui-accordion-${aid}-label-${value}`
  );
};

