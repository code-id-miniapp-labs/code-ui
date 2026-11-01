import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("tabs-item").parts(
  "root",
  "content",
);

export const parts = anatomy.build();
