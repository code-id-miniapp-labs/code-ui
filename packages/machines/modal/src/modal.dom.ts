import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) => partId(scope, "md", "root", "r");

export const getOverlayId = (scope: Scope) =>
  partId(scope, "md", "overlay", "ov");

export const getContainerId = (scope: Scope) =>
  partId(scope, "md", "container", "ct");

export const getContentId = (scope: Scope) =>
  partId(scope, "md", "content", "c");

export const getCloseTriggerId = (scope: Scope) =>
  optPartId(scope, "closeTrigger");

export const getContentSelector = (scope: Scope) => `#${getContentId(scope)}`;
