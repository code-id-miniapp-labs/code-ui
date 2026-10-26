import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("stepper").parts(
  "root",
  "header",
  "list",
  "item",
  "container",
  "trigger",
  "indicator",
  "icon",
  "separator",
  "wrapper",
  "title",
  "description",
  "content",
);

export const parts = anatomy.build();

