import { itemPartId, optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "pi", "root", "r");

export const getControlId = (scope: Scope): string | undefined =>
  optPartId(scope, "control");

export const getInputId = (scope: Scope, index: number): string =>
  itemPartId(scope, "pi", "input", index, "i");

export const getLabelId = (scope: Scope): string =>
  partId(scope, "pi", "label", "l");

export const getSeparatorId = (
  scope: Scope,
  index: number,
): string | undefined => {
  const custom = scope.ids?.separator;
  return typeof custom === "function" ? custom(index) : undefined;
};

export const getHiddenInputId = (scope: Scope): string | undefined =>
  optPartId(scope, "hiddenInput");

