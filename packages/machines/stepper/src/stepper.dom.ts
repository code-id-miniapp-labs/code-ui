export interface StepperDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
}

export const getRootId = (scope: StepperDomScope): string =>
  scope.ids?.root ?? `cui-stepper-${scope.id ?? "root"}`;

export const getListId = (scope: StepperDomScope): string =>
  scope.ids?.list ?? `cui-stepper-${scope.id ?? "root"}-list`;

export const getContentId = (scope: StepperDomScope): string =>
  scope.ids?.content ?? `cui-stepper-${scope.id ?? "root"}-content`;

export const getItemId = (scope: StepperDomScope, index: number): string =>
  scope.ids?.item?.(index) ?? `cui-step-${scope.id ?? "root"}-${index}`;

export const getTriggerId = (scope: StepperDomScope, index: number): string =>
  scope.ids?.trigger?.(index) ?? `cui-step-${scope.id ?? "root"}-trigger-${index}`;

export const getIndicatorId = (
  scope: StepperDomScope,
  index: number,
): string =>
  scope.ids?.indicator?.(index) ??
  `cui-step-${scope.id ?? "root"}-indicator-${index}`;

export const getSeparatorId = (
  scope: StepperDomScope,
  index: number,
): string =>
  scope.ids?.separator?.(index) ??
  `cui-step-${scope.id ?? "root"}-separator-${index}`;

export const getTitleId = (scope: StepperDomScope, index: number): string =>
  scope.ids?.title?.(index) ?? `cui-step-${scope.id ?? "root"}-title-${index}`;

export const getDescriptionId = (
  scope: StepperDomScope,
  index: number,
): string =>
  scope.ids?.description?.(index) ??
  `cui-step-${scope.id ?? "root"}-description-${index}`;
