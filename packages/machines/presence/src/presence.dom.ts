import { partId, type Scope } from "@code-id-labs/core";

export const getRootId = (scope: Scope) => partId(scope, "root", "pr", "r");
export const getRootSelector = (scope: Scope) => `#${getRootId(scope)}`;
