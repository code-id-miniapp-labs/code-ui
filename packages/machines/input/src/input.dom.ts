import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? `input:${scope.id ?? "default"}:root`;

export const getInputId = (scope: Scope): string =>
  scope.ids?.input ?? `input:${scope.id ?? "default"}:input`;

export const getLeadingId = (scope: Scope): string =>
  scope.ids?.leading ?? `input:${scope.id ?? "default"}:leading`;

export const getTrailingId = (scope: Scope): string =>
  scope.ids?.trailing ?? `input:${scope.id ?? "default"}:trailing`;

export const getClearButtonId = (scope: Scope): string =>
  scope.ids?.clear ?? `input:${scope.id ?? "default"}:clear`;

export const getHiddenInputId = (scope: Scope): string =>
  scope.ids?.hiddenInput ?? `input:${scope.id ?? "default"}:hidden-input`;
