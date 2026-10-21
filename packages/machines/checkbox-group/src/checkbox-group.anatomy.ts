import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("checkbox-group").parts(
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
