import { partId, type Scope } from "@code-id-labs/core";

export const getRootId = (scope: Scope) => partId(scope, "bn", "root", "r");
