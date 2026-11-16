import { partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "imi", "root", "r");
