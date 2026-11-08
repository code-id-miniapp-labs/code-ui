import { itemPartId, optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "rdg", "root", "r");

export const getFieldsetId = (scope: Scope): string | undefined =>
  optPartId(scope, "fieldset");

export const getLegendId = (scope: Scope): string =>
  partId(scope, "rdg", "legend", "lg");

export const getItemId = (scope: Scope, value: string): string =>
  itemPartId(scope, "rdg", "item", value, "i");

export const getItemControlId = (scope: Scope, value: string): string =>
  itemPartId(scope, "rdg", "itemControl", value, "c");

export const getItemIndicatorId = (scope: Scope, value: string): string =>
  itemPartId(scope, "rdg", "itemIndicator", value, "ind");

export const getItemLabelId = (scope: Scope, value: string): string =>
  itemPartId(scope, "rdg", "itemLabel", value, "l");

export const getItemDescriptionId = (scope: Scope, value: string): string =>
  itemPartId(scope, "rdg", "itemDescription", value, "d");

export const getHiddenInputId = (scope: Scope): string | undefined =>
  optPartId(scope, "hiddenInput");
