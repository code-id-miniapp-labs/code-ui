import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? `radio:${scope.id ?? "default"}:root`;

export const getBaseId = (scope: Scope): string =>
  scope.ids?.base ?? `radio:${scope.id ?? "default"}:base`;

export const getIndicatorId = (scope: Scope): string =>
  scope.ids?.indicator ?? `radio:${scope.id ?? "default"}:indicator`;

export const getLabelId = (scope: Scope): string =>
  scope.ids?.label ?? `radio:${scope.id ?? "default"}:label`;

export const getDescriptionId = (scope: Scope): string =>
  scope.ids?.description ?? `radio:${scope.id ?? "default"}:description`;
