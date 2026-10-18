import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) =>
  scope.ids?.root ?? `form:${scope.id}:root`;

export const getErrorsId = (scope: Scope) =>
  scope.ids?.errors ?? `form:${scope.id}:errors`;

export const getErrorId = (scope: Scope, name: string) =>
  scope.ids?.error?.(name) ?? `form:${scope.id}:error:${name}`;
