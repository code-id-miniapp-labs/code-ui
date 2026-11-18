import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = createAnatomy("select").parts(
  "root",
  "base",
  "leading",
  "leadingIcon",
  "value",
  "placeholder",
  "trailing",
  "trailingIcon",
  "iconInner",
  "loadingIcon",
  "content",
  "viewport",
  "header",
  "footer",
  "empty",
  "pickerRoot",
  "pickerBackdrop",
  "pickerContent",
  "pickerHeader",
  "pickerCancel",
  "pickerTitle",
  "pickerConfirm",
  "pickerBody",
  "pickerView",
  "pickerColumn",
  "pickerItem",
  "pickerItemDisabled",
  "pickerFooter",
);

export const parts = anatomy.build();
