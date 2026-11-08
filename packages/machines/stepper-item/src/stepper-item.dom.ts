export interface StepperItemDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  stepperId?: string | undefined;
}

const sidOf = (scope: StepperItemDomScope, stepperId?: string): string =>
  stepperId || scope.stepperId || scope.id || "d";

export const getRootId = (
  scope: StepperItemDomScope,
  index: number,
  stepperId?: string,
): string =>
  scope.ids?.item?.(index) ?? `st-${sidOf(scope, stepperId)}-i-${index}`;

export const getTriggerId = (
  scope: StepperItemDomScope,
  index: number,
  stepperId?: string,
): string =>
  scope.ids?.trigger?.(index) ?? `st-${sidOf(scope, stepperId)}-tr-${index}`;

export const getIndicatorId = (
  scope: StepperItemDomScope,
  index: number,
  _stepperId?: string,
): string | undefined => scope.ids?.indicator?.(index);

export const getSeparatorId = (
  scope: StepperItemDomScope,
  index: number,
  _stepperId?: string,
): string | undefined => scope.ids?.separator?.(index);

export const getTitleId = (
  scope: StepperItemDomScope,
  index: number,
  _stepperId?: string,
): string | undefined => scope.ids?.title?.(index);

export const getDescriptionId = (
  scope: StepperItemDomScope,
  index: number,
  _stepperId?: string,
): string | undefined => scope.ids?.description?.(index);
