import { itemPartId, optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "im", "root", "r");

export const getTriggerId = (scope: Scope): string =>
  partId(scope, "im", "trigger", "t");

export const getInputId = (scope: Scope): string =>
  partId(scope, "im", "input", "i");

export const getContentId = (scope: Scope): string =>
  partId(scope, "im", "content", "c");

export const getHiddenInputId = (scope: Scope): string | undefined =>
  optPartId(scope, "hiddenInput");

export const getOptionId = (scope: Scope, index: number): string =>
  itemPartId(scope, "cui-im", "option", index, "opt");
