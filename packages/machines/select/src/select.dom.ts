import { itemPartId, optPartId, partId, type Scope } from "@code-id-labs/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "slc", "root", "r");

export const getTriggerId = (scope: Scope): string =>
  partId(scope, "slc", "trigger", "t");

export const getContentId = (scope: Scope): string =>
  partId(scope, "slc", "content", "c");

export const getPickerId = (scope: Scope): string | undefined =>
  optPartId(scope, "picker");

export const getHiddenInputId = (scope: Scope): string | undefined =>
  optPartId(scope, "hiddenInput");

export const getOptionId = (scope: Scope, index: number): string =>
  itemPartId(scope, "cui-sel", "option", index, "opt");
