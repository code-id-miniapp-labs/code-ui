import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("radio-group").parts(
  "root",
  "fieldset",
  "legend",
  "item",
  "base",
  "indicator",
  "wrapper",
  "label",
  "description",
);

export const parts = anatomy.build();
