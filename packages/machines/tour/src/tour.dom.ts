import { optPartId, partId, type Scope } from "@code-id-labs/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "tr", "root", "r");

export const getBackdropId = (scope: Scope): string | undefined =>
  optPartId(scope, "backdrop");

export const getSpotlightId = (scope: Scope): string | undefined =>
  optPartId(scope, "spotlight");

export const getPositionerId = (scope: Scope): string | undefined =>
  optPartId(scope, "positioner");

export const getContentId = (scope: Scope): string =>
  partId(scope, "tr", "content", "c");

export const getTitleId = (scope: Scope): string | undefined =>
  optPartId(scope, "title");

export const getDescriptionId = (scope: Scope): string | undefined =>
  optPartId(scope, "description");

export const getCloseTriggerId = (scope: Scope): string | undefined =>
  optPartId(scope, "closeTrigger");
