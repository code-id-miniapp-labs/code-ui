import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? `progress:${scope.id}`;

export const getLabelId = (scope: Scope): string =>
  scope.ids?.label ?? `progress:${scope.id}:label`;

export const getTrackId = (scope: Scope): string =>
  scope.ids?.track ?? `progress:${scope.id}:track`;

export const getRangeId = (scope: Scope): string =>
  scope.ids?.range ?? `progress:${scope.id}:range`;

export const getValueTextId = (scope: Scope): string =>
  scope.ids?.valueText ?? `progress:${scope.id}:value-text`;

export const getViewId = (scope: Scope): string =>
  scope.ids?.view ?? `progress:${scope.id}:view`;

export const getCircleId = (scope: Scope): string =>
  scope.ids?.circle ?? `progress:${scope.id}:circle`;

export const getCircleTrackId = (scope: Scope): string =>
  scope.ids?.circleTrack ?? `progress:${scope.id}:circle-track`;

export const getCircleRangeId = (scope: Scope): string =>
  scope.ids?.circleRange ?? `progress:${scope.id}:circle-range`;

