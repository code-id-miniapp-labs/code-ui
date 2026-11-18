import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("popover").parts(
  "root",
  "trigger",
  "backdrop",
  "positioner",
  "content",
  "arrow",
);

export const parts = anatomy.build();
