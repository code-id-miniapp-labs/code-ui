import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("toast").parts(
  "root",
  "wrapper",
  "title",
  "description",
  "icon",
  "actions",
  "action",
  "closeTrigger",
  "progress",
);

export const parts = anatomy.build();

