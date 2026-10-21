import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? `checkbox:${scope.id ?? "default"}:root`;

export const getBaseId = (scope: Scope): string =>
  scope.ids?.base ?? `checkbox:${scope.id ?? "default"}:base`;

export const getIndicatorId = (scope: Scope): string =>
  scope.ids?.indicator ?? `checkbox:${scope.id ?? "default"}:indicator`;

export const getLabelId = (scope: Scope): string =>
  scope.ids?.label ?? `checkbox:${scope.id ?? "default"}:label`;

export const getDescriptionId = (scope: Scope): string =>
  scope.ids?.description ?? `checkbox:${scope.id ?? "default"}:description`;

export const getHiddenInputId = (scope: Scope): string =>
  scope.ids?.hiddenInput ?? `checkbox:${scope.id ?? "default"}:hidden-input`;
