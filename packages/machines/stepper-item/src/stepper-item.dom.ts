export interface StepperItemDomScope {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  stepperId?: string | undefined;
}

export const getRootId = (
  scope: StepperItemDomScope,
  index: number,
  stepperId?: string,
): string => {
  const sid = stepperId || scope.stepperId || scope.id || "root";
  return scope.ids?.item?.(index) ?? `cui-step-${sid}-${index}`;
};

export const getTriggerId = (
  scope: StepperItemDomScope,
  index: number,
  stepperId?: string,
): string => {
  const sid = stepperId || scope.stepperId || scope.id || "root";
  return (
    scope.ids?.trigger?.(index) ??
    `cui-step-${sid}-trigger-${index}`
  );
};

export const getIndicatorId = (
  scope: StepperItemDomScope,
  index: number,
  stepperId?: string,
): string => {
  const sid = stepperId || scope.stepperId || scope.id || "root";
  return (
    scope.ids?.indicator?.(index) ??
    `cui-step-${sid}-indicator-${index}`
  );
};

export const getSeparatorId = (
  scope: StepperItemDomScope,
  index: number,
  stepperId?: string,
): string => {
  const sid = stepperId || scope.stepperId || scope.id || "root";
  return (
    scope.ids?.separator?.(index) ??
    `cui-step-${sid}-separator-${index}`
  );
};

export const getTitleId = (
  scope: StepperItemDomScope,
  index: number,
  stepperId?: string,
): string => {
  const sid = stepperId || scope.stepperId || scope.id || "root";
  return scope.ids?.title?.(index) ?? `cui-step-${sid}-title-${index}`;
};

export const getDescriptionId = (
  scope: StepperItemDomScope,
  index: number,
  stepperId?: string,
): string => {
  const sid = stepperId || scope.stepperId || scope.id || "root";
  return (
    scope.ids?.description?.(index) ??
    `cui-step-${sid}-description-${index}`
  );
};
