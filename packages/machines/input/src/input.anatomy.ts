import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("input").parts(
  "root",
  "base",
  "leading",
  "leadingIcon",
  "trailing",
  "trailingIcon",
  "clear",
);

export const parts = anatomy.build();
