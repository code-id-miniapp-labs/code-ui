import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? `switch:${scope.id ?? "default"}:root`;

export const getBaseId = (scope: Scope): string =>
  scope.ids?.base ?? `switch:${scope.id ?? "default"}:base`;

export const getContainerId = (scope: Scope): string =>
  scope.ids?.container ?? `switch:${scope.id ?? "default"}:container`;

export const getThumbId = (scope: Scope): string =>
  scope.ids?.thumb ?? `switch:${scope.id ?? "default"}:thumb`;

export const getLabelId = (scope: Scope): string =>
  scope.ids?.label ?? `switch:${scope.id ?? "default"}:label`;

export const getDescriptionId = (scope: Scope): string =>
  scope.ids?.description ?? `switch:${scope.id ?? "default"}:description`;

export const getHiddenInputId = (scope: Scope): string =>
  scope.ids?.hiddenInput ?? `switch:${scope.id ?? "default"}:hidden-input`;
