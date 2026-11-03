import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) =>
  scope.ids?.root ?? `toast:${scope.id ?? "default"}:root`;

export const getWrapperId = (scope: Scope) =>
  scope.ids?.wrapper ?? `toast:${scope.id ?? "default"}:wrapper`;

export const getTitleId = (scope: Scope) =>
  scope.ids?.title ?? `toast:${scope.id ?? "default"}:title`;

export const getDescriptionId = (scope: Scope) =>
  scope.ids?.description ?? `toast:${scope.id ?? "default"}:description`;

export const getIconId = (scope: Scope) =>
  scope.ids?.icon ?? `toast:${scope.id ?? "default"}:icon`;

export const getCloseTriggerId = (scope: Scope) =>
  scope.ids?.closeTrigger ?? `toast:${scope.id ?? "default"}:close-trigger`;

export const getActionsId = (scope: Scope) =>
  scope.ids?.actions ?? `toast:${scope.id ?? "default"}:actions`;

export const getActionId = (scope: Scope, index: number) =>
  scope.ids?.action ? `${scope.ids.action}:${index}` : `toast:${scope.id ?? "default"}:action:${index}`;

export const getProgressId = (scope: Scope) =>
  scope.ids?.progress ?? `toast:${scope.id ?? "default"}:progress`;

