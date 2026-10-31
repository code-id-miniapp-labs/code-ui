import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("accordion-item").parts(
  "root",
  "header",
  "trigger",
  "leading",
  "leadingIcon",
  "label",
  "description",
  "trailing",
  "trailingIcon",
  "content",
  "body",
);

export const parts = anatomy.build();

