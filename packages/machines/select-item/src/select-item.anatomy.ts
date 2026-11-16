import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("select-item").parts(
  "root",
  "base",
  "leading",
  "leadingIcon",
  "wrapper",
  "label",
  "description",
  "trailing",
  "trailingIcon",
  "groupLabel",
  "separator",
);

export const parts = anatomy.build();
