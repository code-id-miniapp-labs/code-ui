import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "rd", "root", "r");

export const getBaseId = (scope: Scope): string =>
  partId(scope, "rd", "base", "b");

export const getIndicatorId = (scope: Scope): string | undefined =>
  optPartId(scope, "indicator");

export const getLabelId = (scope: Scope): string =>
  partId(scope, "rd", "label", "l");

export const getDescriptionId = (scope: Scope): string | undefined =>
  optPartId(scope, "description");
