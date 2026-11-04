import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("pull-down-refresh").parts(
  "root",
  "header",
  "track",
  "tips",
  "indicator",
  "text",
  "content",
);

export const parts = anatomy.build();
