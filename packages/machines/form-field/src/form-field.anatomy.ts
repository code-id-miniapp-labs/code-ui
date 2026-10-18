import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("form-field").parts(
  "root",
  "labelWrapper",
  "label",
  "required",
  "hint",
  "description",
  "container",
  "help",
  "error",
);

export const parts = anatomy.build();
