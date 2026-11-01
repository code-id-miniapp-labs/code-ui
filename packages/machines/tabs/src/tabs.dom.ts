export interface TabsDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
}

export const getRootId = (scope: TabsDomScope): string =>
  scope.ids?.root ?? `cui-tabs-${scope.id ?? "root"}`;

export const getListId = (scope: TabsDomScope): string =>
  scope.ids?.list ?? `cui-tabs-${scope.id ?? "root"}-list`;

export const getIndicatorId = (scope: TabsDomScope): string =>
  scope.ids?.indicator ?? `cui-tabs-${scope.id ?? "root"}-indicator`;

export const getTriggerId = (
  scope: TabsDomScope,
  value: string | number,
): string =>
  scope.ids?.trigger?.(value) ??
  `cui-tabs-${scope.id ?? "root"}-trigger-${value}`;

export const getContentId = (
  scope: TabsDomScope,
  value: string | number,
): string =>
  scope.ids?.content?.(value) ??
  `cui-tabs-${scope.id ?? "root"}-content-${value}`;

export const getLeadingId = (
  scope: TabsDomScope,
  value: string | number,
): string =>
  scope.ids?.leading?.(value) ??
  `cui-tabs-${scope.id ?? "root"}-leading-${value}`;

export const getLabelId = (
  scope: TabsDomScope,
  value: string | number,
): string =>
  scope.ids?.label?.(value) ?? `cui-tabs-${scope.id ?? "root"}-label-${value}`;

export const getTrailingId = (
  scope: TabsDomScope,
  value: string | number,
): string =>
  scope.ids?.trailing?.(value) ??
  `cui-tabs-${scope.id ?? "root"}-trailing-${value}`;

