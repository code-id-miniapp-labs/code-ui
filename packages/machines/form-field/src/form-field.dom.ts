import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "ff", "root", "r");

export const getLabelWrapperId = (scope: Scope): string | undefined =>
  optPartId(scope, "labelWrapper");

export const getLabelId = (scope: Scope): string =>
  partId(scope, "ff", "label", "l");

export const getRequiredId = (scope: Scope): string | undefined =>
  optPartId(scope, "required");

export const getHintId = (scope: Scope): string | undefined =>
  optPartId(scope, "hint");

export const getDescriptionId = (scope: Scope): string | undefined =>
  optPartId(scope, "description");

export const getContainerId = (scope: Scope): string | undefined =>
  optPartId(scope, "container");

export const getHelpId = (scope: Scope): string | undefined =>
  optPartId(scope, "help");

export const getErrorId = (scope: Scope): string =>
  partId(scope, "ff", "error", "e");
