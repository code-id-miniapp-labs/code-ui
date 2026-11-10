import { itemPartId, optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope): string =>
  partId(scope, "fu", "root", "r");

export const getDropzoneId = (scope: Scope): string =>
  partId(scope, "fu", "dropzone", "dz");

export const getFileListId = (scope: Scope): string =>
  partId(scope, "fu", "fileList", "fl");

export const getFileId = (scope: Scope, index: number | string): string =>
  itemPartId(scope, "fu", "file", index, "f");

export const getFileRemoveId = (
  scope: Scope,
  index: number | string,
): string => itemPartId(scope, "fu", "fileRemove", index, "rm");

export const getFilePreviewId = (
  scope: Scope,
  index: number | string,
): string => itemPartId(scope, "fu", "filePreview", index, "pv");

export const getHiddenInputId = (scope: Scope): string | undefined =>
  optPartId(scope, "hiddenInput");

