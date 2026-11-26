import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = createAnatomy("tour").parts(
  "root",
  "backdrop",
  "spotlight",
  "positioner",
  "content",
  "arrow",
  "header",
  "wrapper",
  "badge",
  "title",
  "description",
  "body",
  "footer",
  "progressText",
  "progress",
  "progressDot",
  "progressDotActive",
  "actions",
  "closeTrigger",
  "closeButton",
  "closeIcon",
);

export const parts = anatomy.build();
