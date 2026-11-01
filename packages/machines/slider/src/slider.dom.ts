import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? `slider:${scope.id ?? "default"}:root`;

export const getControlId = (scope: Scope): string =>
  scope.ids?.control ?? `slider:${scope.id ?? "default"}:control`;

export const getTrackId = (scope: Scope): string =>
  scope.ids?.track ?? `slider:${scope.id ?? "default"}:track`;

export const getRangeId = (scope: Scope): string =>
  scope.ids?.range ?? `slider:${scope.id ?? "default"}:range`;

export const getThumbId = (scope: Scope, index = 0): string =>
  scope.ids?.thumb?.(index) ?? `slider:${scope.id ?? "default"}:thumb-${index}`;

export const getLabelId = (scope: Scope): string =>
  scope.ids?.label ?? `slider:${scope.id ?? "default"}:label`;

export const getValueTextId = (scope: Scope): string =>
  scope.ids?.valueText ?? `slider:${scope.id ?? "default"}:value-text`;

export const getMarkerGroupId = (scope: Scope): string =>
  scope.ids?.markerGroup ?? `slider:${scope.id ?? "default"}:marker-group`;

export const getMarkerId = (scope: Scope, value: number): string =>
  scope.ids?.marker?.(value) ?? `slider:${scope.id ?? "default"}:marker-${value}`;

