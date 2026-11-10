import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) => partId(scope, "bn", "root", "r");

export const getWrapperId = (scope: Scope) => optPartId(scope, "wrapper");

export const getTitleId = (scope: Scope) => optPartId(scope, "title");

export const getDescriptionId = (scope: Scope) =>
  optPartId(scope, "description");

export const getIconId = (scope: Scope) => optPartId(scope, "icon");

export const getCloseTriggerId = (scope: Scope) =>
  optPartId(scope, "closeTrigger");

export const getActionsId = (scope: Scope) => optPartId(scope, "actions");

export const getActionId = (scope: Scope, index: number) =>
  typeof scope.ids?.action === "string"
    ? `${scope.ids.action}-${index}`
    : undefined;
