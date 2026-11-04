import type { Scope } from "@code-ui/core";

const prefix = (scope: Scope, part: string) =>
  `cui-pull-down-refresh-${scope.id ?? "default"}-${part}`;

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? prefix(scope, "root");

export const getHeaderId = (scope: Scope): string =>
  scope.ids?.header ?? prefix(scope, "header");

export const getTrackId = (scope: Scope): string =>
  scope.ids?.track ?? prefix(scope, "track");

export const getTipsId = (scope: Scope): string =>
  scope.ids?.tips ?? prefix(scope, "tips");

export const getContentId = (scope: Scope): string =>
  scope.ids?.content ?? prefix(scope, "content");
