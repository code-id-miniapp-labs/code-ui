import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("swipe-cell").parts(
  "root",
  "wrapper",
  "left",
  "content",
  "right",
  "action",
  "actionText",
  "actionIcon",
);

export const parts = anatomy.build();

