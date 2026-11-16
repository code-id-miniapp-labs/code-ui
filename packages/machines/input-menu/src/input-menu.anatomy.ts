import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("input-menu").parts(
  "root",
  "base",
  "leading",
  "leadingIcon",
  "tagsItem",
  "tagsItemIcon",
  "tagsItemText",
  "tagsItemDelete",
  "tagsItemDeleteIcon",
  "nativeInput",
  "trailing",
  "trailingIcon",
  "iconInner",
  "loadingIcon",
  "content",
  "viewport",
  "header",
  "footer",
  "empty",
  "createItem",
  "createItemIcon",
  "createItemLabel",
);

export const parts = anatomy.build();
