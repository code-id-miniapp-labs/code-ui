export interface TabsItemDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
}

export const getRootId = (
  scope: TabsItemDomScope,
  value?: string | number,
): string =>
  scope.ids?.root ?? `cui-tabs-item-${scope.id ?? value ?? "item"}`;

export const getContentId = (
  scope: TabsItemDomScope,
  value?: string | number,
): string =>
  scope.ids?.content ?? `cui-tabs-item-${scope.id ?? value ?? "item"}-content`;

export const getTriggerId = (
  scope: TabsItemDomScope,
  tabsId?: string,
  value?: string | number,
): string =>
  scope.ids?.trigger ??
  `cui-tabs-${tabsId ?? "root"}-trigger-${value ?? scope.id ?? "item"}`;

