import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("checkbox").parts(
  "root",
  "base",
  "indicator",
  "icon",
  "wrapper",
  "label",
  "description",
);

export const parts = anatomy.build();
