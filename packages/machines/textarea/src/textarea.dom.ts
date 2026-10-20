import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? `textarea:${scope.id ?? "default"}:root`;

export const getTextareaId = (scope: Scope): string =>
  scope.ids?.textarea ?? `textarea:${scope.id ?? "default"}:textarea`;

export const getLeadingId = (scope: Scope): string =>
  scope.ids?.leading ?? `textarea:${scope.id ?? "default"}:leading`;

export const getTrailingId = (scope: Scope): string =>
  scope.ids?.trailing ?? `textarea:${scope.id ?? "default"}:trailing`;

export const getClearButtonId = (scope: Scope): string =>
  scope.ids?.clear ?? `textarea:${scope.id ?? "default"}:clear`;

export const getCountId = (scope: Scope): string =>
  scope.ids?.count ?? `textarea:${scope.id ?? "default"}:count`;

export const getHiddenInputId = (scope: Scope): string =>
  scope.ids?.hiddenInput ?? `textarea:${scope.id ?? "default"}:hidden-input`;
