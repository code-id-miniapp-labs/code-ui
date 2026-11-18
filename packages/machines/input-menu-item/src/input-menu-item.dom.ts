import { partId, type Scope } from "@code-id-labs/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "imi", "root", "r");
