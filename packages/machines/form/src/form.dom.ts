import { itemPartId, optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "fm", "root", "r");

export const getErrorsId = (scope: Scope): string | undefined =>
  optPartId(scope, "errors");

export const getErrorId = (scope: Scope, name: string): string =>
  itemPartId(scope, "fm", "error", name, "e");
