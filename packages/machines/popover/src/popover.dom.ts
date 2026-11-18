import { optPartId, partId, type Scope } from "@code-id-labs/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "fm", "root", "r");

export const getTriggerId = (scope: Scope): string =>
  partId(scope, "fm", "trigger", "t");

export const getBackdropId = (scope: Scope): string | undefined =>
  optPartId(scope, "backdrop");

export const getPositionerId = (scope: Scope): string | undefined =>
  optPartId(scope, "positioner");

export const getContentId = (scope: Scope): string =>
  partId(scope, "fm", "content", "c");
