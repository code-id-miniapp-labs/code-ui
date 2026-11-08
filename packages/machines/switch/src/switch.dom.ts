import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "sw", "root", "r");

export const getBaseId = (scope: Scope): string =>
  partId(scope, "sw", "base", "b");

export const getContainerId = (scope: Scope): string | undefined =>
  optPartId(scope, "container");

export const getThumbId = (scope: Scope): string | undefined =>
  optPartId(scope, "thumb");

export const getLabelId = (scope: Scope): string =>
  partId(scope, "sw", "label", "l");

export const getDescriptionId = (scope: Scope): string | undefined =>
  optPartId(scope, "description");

export const getHiddenInputId = (scope: Scope): string | undefined =>
  optPartId(scope, "hiddenInput");
