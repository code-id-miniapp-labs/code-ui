import { optPartId, partId, type Scope } from "@code-id-labs/core";

export const getRootId = (scope: Scope) => partId(scope, "dr", "root", "r");

export const getContentId = (scope: Scope) =>
  partId(scope, "dr", "content", "c");

export const getBackdropId = (scope: Scope) =>
  partId(scope, "dr", "backdrop", "bd");

export const getCloseTriggerId = (scope: Scope) =>
  optPartId(scope, "closeTrigger");

export const getGrabberId = (scope: Scope) => optPartId(scope, "grabber");

export const getContentSelector = (scope: Scope) => `#${getContentId(scope)}`;
