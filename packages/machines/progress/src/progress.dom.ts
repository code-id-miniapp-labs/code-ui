import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "pg", "root", "r");

export const getLabelId = (scope: Scope): string =>
  partId(scope, "pg", "label", "l");

export const getTrackId = (scope: Scope): string | undefined =>
  optPartId(scope, "track");

export const getRangeId = (scope: Scope): string | undefined =>
  optPartId(scope, "range");

export const getValueTextId = (scope: Scope): string | undefined =>
  optPartId(scope, "valueText");

export const getViewId = (scope: Scope): string | undefined =>
  optPartId(scope, "view");

export const getCircleId = (scope: Scope): string | undefined =>
  optPartId(scope, "circle");
