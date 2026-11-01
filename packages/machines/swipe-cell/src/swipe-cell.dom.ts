import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? `cui-swipe-cell-${scope.id ?? "default"}-root`;

export const getWrapperId = (scope: Scope): string =>
  scope.ids?.wrapper ?? `cui-swipe-cell-${scope.id ?? "default"}-wrapper`;

export const getContentId = (scope: Scope): string =>
  scope.ids?.content ?? `cui-swipe-cell-${scope.id ?? "default"}-content`;

export const getLeftId = (scope: Scope): string =>
  scope.ids?.left ?? `cui-swipe-cell-${scope.id ?? "default"}-left`;

export const getRightId = (scope: Scope): string =>
  scope.ids?.right ?? `cui-swipe-cell-${scope.id ?? "default"}-right`;

