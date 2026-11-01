import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("tabs-item").parts(
  "root",
  "content",
  "trigger",
  "leading",
  "label",
  "trailing",
  "indicator",
);

export const parts = anatomy.build();
