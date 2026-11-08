import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "in", "root", "r");

export const getInputId = (scope: Scope): string =>
  partId(scope, "in", "input", "i");

export const getLeadingId = (scope: Scope): string | undefined =>
  optPartId(scope, "leading");

export const getTrailingId = (scope: Scope): string | undefined =>
  optPartId(scope, "trailing");

export const getClearButtonId = (scope: Scope): string | undefined =>
  optPartId(scope, "clear");

export const getHiddenInputId = (scope: Scope): string | undefined =>
  optPartId(scope, "hiddenInput");
