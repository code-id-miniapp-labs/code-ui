import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("textarea").parts(
  "root",
  "base",
  "leading",
  "leadingIcon",
  "trailing",
  "trailingIcon",
  "clear",
  "count",
);

export const parts = anatomy.build();
