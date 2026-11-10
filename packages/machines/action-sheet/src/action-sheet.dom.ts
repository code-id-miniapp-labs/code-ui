import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) => partId(scope, "as", "root", "r");

export const getContentId = (scope: Scope) =>
  partId(scope, "as", "content", "c");

export const getBackdropId = (scope: Scope) =>
  partId(scope, "as", "backdrop", "bd");

export const getHeaderId = (scope: Scope) => optPartId(scope, "header");

export const getCloseTriggerId = (scope: Scope) =>
  optPartId(scope, "closeTrigger");

export const getBodyId = (scope: Scope) => optPartId(scope, "body");

export const getCancelId = (scope: Scope) => optPartId(scope, "cancel");
