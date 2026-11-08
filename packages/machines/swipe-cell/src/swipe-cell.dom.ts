import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "sc", "root", "r");

export const getWrapperId = (scope: Scope): string =>
  partId(scope, "sc", "wrapper", "w");

export const getContentId = (scope: Scope) => optPartId(scope, "content");

export const getLeftId = (scope: Scope) => optPartId(scope, "left");

export const getRightId = (scope: Scope) => optPartId(scope, "right");

