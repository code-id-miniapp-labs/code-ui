import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "pdr", "root", "r");

export const getHeaderId = (scope: Scope) => optPartId(scope, "header");

export const getTrackId = (scope: Scope): string =>
  partId(scope, "pdr", "track", "tr");

export const getTipsId = (scope: Scope): string =>
  partId(scope, "pdr", "tips", "tp");

export const getContentId = (scope: Scope) => optPartId(scope, "content");
