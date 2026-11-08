import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "btn", "root", "r");

export const getLabelId = (scope: Scope): string | undefined =>
  optPartId(scope, "label");

export const getIconId = (scope: Scope): string | undefined =>
  optPartId(scope, "icon");

export const getSpinnerId = (scope: Scope): string | undefined =>
  optPartId(scope, "spinner");
