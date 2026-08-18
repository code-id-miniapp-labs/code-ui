import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("drawer").parts(
  "root",
  "trigger",
  "backdrop",
  "positioner",
  "content",
  "title",
  "description",
  "closeTrigger",
  "grabber",
);

export const parts = anatomy.build();
