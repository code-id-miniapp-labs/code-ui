import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("tabs").parts(
  "root",
  "list",
  "content",
);

export const parts = anatomy.build();
