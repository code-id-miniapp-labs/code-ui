import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) =>
  scope.ids?.root ?? `qr-code:${scope.id ?? "default"}:root`;

export const getFrameId = (scope: Scope) =>
  scope.ids?.frame ?? `qr-code:${scope.id ?? "default"}:frame`;

export const getPatternId = (scope: Scope) =>
  scope.ids?.pattern ?? `qr-code:${scope.id ?? "default"}:pattern`;

export const getOverlayId = (scope: Scope) =>
  scope.ids?.overlay ?? `qr-code:${scope.id ?? "default"}:overlay`;
