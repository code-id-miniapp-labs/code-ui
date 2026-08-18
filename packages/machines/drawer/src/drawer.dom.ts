import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) =>
  scope.ids?.root ?? `drawer:${scope.id ?? "default"}:root`;

export const getContentId = (scope: Scope) =>
  scope.ids?.content ?? `drawer:${scope.id ?? "default"}:content`;

export const getBackdropId = (scope: Scope) =>
  scope.ids?.backdrop ?? `drawer:${scope.id ?? "default"}:backdrop`;

export const getCloseTriggerId = (scope: Scope) =>
  scope.ids?.closeTrigger ?? `drawer:${scope.id ?? "default"}:close-trigger`;

export const getGrabberId = (scope: Scope) =>
  scope.ids?.grabber ?? `drawer:${scope.id ?? "default"}:grabber`;

export const getContentSelector = (scope: Scope) => `#${getContentId(scope)}`;
