export interface TabsItemDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
}

export const getRootId = (
  scope: TabsItemDomScope,
  value?: string | number,
): string => scope.ids?.root ?? `tbi-${scope.id ?? value ?? "d"}-r`;

export const getContentId = (
  scope: TabsItemDomScope,
  value?: string | number,
): string => scope.ids?.content ?? `tbi-${scope.id ?? value ?? "d"}-c`;

export const getTriggerId = (
  scope: TabsItemDomScope,
  tabsId?: string,
  value?: string | number,
): string =>
  scope.ids?.trigger ??
  `tb-${tabsId || "d"}-tr-${value ?? scope.id ?? "i"}`;
