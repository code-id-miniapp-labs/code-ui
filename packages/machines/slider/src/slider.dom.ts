import { itemPartId, optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "sl", "root", "r");

export const getControlId = (scope: Scope): string =>
  partId(scope, "sl", "control", "c");

export const getTrackId = (scope: Scope): string | undefined =>
  optPartId(scope, "track");

export const getRangeId = (scope: Scope): string =>
  partId(scope, "sl", "range", "rg");

export const getThumbId = (scope: Scope, index = 0): string =>
  itemPartId(scope, "sl", "thumb", index, "t");

export const getLabelId = (scope: Scope): string =>
  partId(scope, "sl", "label", "l");

export const getValueTextId = (scope: Scope): string | undefined =>
  optPartId(scope, "valueText");

export const getMarkerGroupId = (scope: Scope): string | undefined =>
  optPartId(scope, "markerGroup");

export const getMarkerId = (scope: Scope, value: number): string =>
  itemPartId(scope, "sl", "marker", value, "m");

