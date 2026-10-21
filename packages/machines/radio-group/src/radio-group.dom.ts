import type { Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  scope.ids?.root ?? `radio-group:${scope.id ?? "default"}:root`;

export const getFieldsetId = (scope: Scope): string =>
  scope.ids?.fieldset ?? `radio-group:${scope.id ?? "default"}:fieldset`;

export const getLegendId = (scope: Scope): string =>
  scope.ids?.legend ?? `radio-group:${scope.id ?? "default"}:legend`;

export const getItemId = (scope: Scope, value: string): string =>
  scope.ids?.item?.(value) ??
  `radio-group:${scope.id ?? "default"}:item:${value}`;

export const getItemControlId = (scope: Scope, value: string): string =>
  scope.ids?.itemControl?.(value) ??
  `radio-group:${scope.id ?? "default"}:control:${value}`;

export const getItemIndicatorId = (scope: Scope, value: string): string =>
  scope.ids?.itemIndicator?.(value) ??
  `radio-group:${scope.id ?? "default"}:indicator:${value}`;

export const getItemLabelId = (scope: Scope, value: string): string =>
  scope.ids?.itemLabel?.(value) ??
  `radio-group:${scope.id ?? "default"}:label:${value}`;

export const getItemDescriptionId = (scope: Scope, value: string): string =>
  scope.ids?.itemDescription?.(value) ??
  `radio-group:${scope.id ?? "default"}:desc:${value}`;

export const getHiddenInputId = (scope: Scope): string =>
  scope.ids?.hiddenInput ??
  `radio-group:${scope.id ?? "default"}:hidden-input`;
