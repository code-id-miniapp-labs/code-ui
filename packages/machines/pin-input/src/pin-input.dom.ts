import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) =>
  scope.ids?.root ?? `pin-input:${scope.id ?? "default"}:root`;

export const getControlId = (scope: Scope) =>
  scope.ids?.control ?? `pin-input:${scope.id ?? "default"}:control`;

export const getInputId = (scope: Scope, index: number) =>
  scope.ids?.input?.(index) ?? `pin-input:${scope.id ?? "default"}:input:${index}`;

export const getLabelId = (scope: Scope) =>
  scope.ids?.label ?? `pin-input:${scope.id ?? "default"}:label`;

export const getSeparatorId = (scope: Scope, index: number) =>
  scope.ids?.separator?.(index) ??
  `pin-input:${scope.id ?? "default"}:separator:${index}`;
