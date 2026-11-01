import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? `swipe-cell:${scope.id ?? "default"}:root`;

export const getWrapperId = (scope: Scope): string =>
  scope.ids?.wrapper ?? `swipe-cell:${scope.id ?? "default"}:wrapper`;

export const getContentId = (scope: Scope): string =>
  scope.ids?.content ?? `swipe-cell:${scope.id ?? "default"}:content`;

export const getLeftId = (scope: Scope): string =>
  scope.ids?.left ?? `swipe-cell:${scope.id ?? "default"}:left`;

export const getRightId = (scope: Scope): string =>
  scope.ids?.right ?? `swipe-cell:${scope.id ?? "default"}:right`;

