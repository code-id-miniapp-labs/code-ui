import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = createAnatomy("popover").parts(
  "root",
  "trigger",
  "backdrop",
  "positioner",
  "content",
  "arrow",
);

export const parts = anatomy.build();
