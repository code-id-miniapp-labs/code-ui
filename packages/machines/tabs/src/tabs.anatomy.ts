import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("tabs").parts(
  "root",
  "list",
  "indicator",
  "trigger",
  "leading",
  "label",
  "trailing",
  "content",
);

export const parts = anatomy.build();

