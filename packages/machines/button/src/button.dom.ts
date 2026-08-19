import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) =>
  scope.ids?.root ?? `button:${scope.id ?? "default"}:root`;

export const getLabelId = (scope: Scope) =>
  scope.ids?.label ?? `button:${scope.id ?? "default"}:label`;

export const getIconId = (scope: Scope) =>
  scope.ids?.icon ?? `button:${scope.id ?? "default"}:icon`;

export const getSpinnerId = (scope: Scope) =>
  scope.ids?.spinner ?? `button:${scope.id ?? "default"}:spinner`;
