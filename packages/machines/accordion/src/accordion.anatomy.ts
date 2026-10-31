import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("accordion").parts(
  "root",
  "item",
  "header",
  "trigger",
  "leading",
  "leadingIcon",
  "label",
  "trailing",
  "trailingIcon",
  "content",
  "body",
);

export const parts = anatomy.build();

