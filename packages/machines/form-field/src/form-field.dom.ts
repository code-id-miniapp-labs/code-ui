import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) =>
  scope.ids?.root ?? `form-field:${scope.id ?? "default"}:root`;

export const getLabelWrapperId = (scope: Scope) =>
  scope.ids?.labelWrapper ?? `form-field:${scope.id ?? "default"}:label-wrapper`;

export const getLabelId = (scope: Scope) =>
  scope.ids?.label ?? `form-field:${scope.id ?? "default"}:label`;

export const getRequiredId = (scope: Scope) =>
  scope.ids?.required ?? `form-field:${scope.id ?? "default"}:required`;

export const getHintId = (scope: Scope) =>
  scope.ids?.hint ?? `form-field:${scope.id ?? "default"}:hint`;

export const getDescriptionId = (scope: Scope) =>
  scope.ids?.description ?? `form-field:${scope.id ?? "default"}:description`;

export const getContainerId = (scope: Scope) =>
  scope.ids?.container ?? `form-field:${scope.id ?? "default"}:container`;

export const getHelpId = (scope: Scope) =>
  scope.ids?.help ?? `form-field:${scope.id ?? "default"}:help`;

export const getErrorId = (scope: Scope) =>
  scope.ids?.error ?? `form-field:${scope.id ?? "default"}:error`;
