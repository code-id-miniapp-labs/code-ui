import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "cb", "root", "r");

export const getBaseId = (scope: Scope): string =>
  partId(scope, "cb", "base", "b");

export const getIndicatorId = (scope: Scope): string | undefined =>
  optPartId(scope, "indicator");

export const getLabelId = (scope: Scope): string =>
  partId(scope, "cb", "label", "l");

export const getDescriptionId = (scope: Scope): string | undefined =>
  optPartId(scope, "description");

export const getHiddenInputId = (scope: Scope): string | undefined =>
  optPartId(scope, "hiddenInput");
