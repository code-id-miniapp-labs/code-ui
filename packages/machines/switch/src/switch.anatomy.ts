import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("switch").parts(
  "root",
  "base",
  "container",
  "thumb",
  "icon",
  "wrapper",
  "label",
  "description",
);

export const parts = anatomy.build();
