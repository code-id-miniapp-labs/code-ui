import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("stepper-item").parts(
  "root",
  "container",
  "trigger",
  "indicator",
  "icon",
  "separator",
  "wrapper",
  "title",
  "description",
);

export const parts = anatomy.build();
