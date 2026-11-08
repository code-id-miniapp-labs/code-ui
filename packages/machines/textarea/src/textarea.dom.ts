import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "ta", "root", "r");

export const getTextareaId = (scope: Scope): string =>
  partId(scope, "ta", "textarea", "t");

export const getLeadingId = (scope: Scope): string | undefined =>
  optPartId(scope, "leading");

export const getTrailingId = (scope: Scope): string | undefined =>
  optPartId(scope, "trailing");

export const getClearButtonId = (scope: Scope): string | undefined =>
  optPartId(scope, "clear");

export const getCountId = (scope: Scope): string | undefined =>
  optPartId(scope, "count");

export const getHiddenInputId = (scope: Scope): string | undefined =>
  optPartId(scope, "hiddenInput");
