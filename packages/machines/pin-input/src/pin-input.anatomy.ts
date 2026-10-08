import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("pin-input").parts(
  "root",
  "control",
  "input",
  "label",
  "separator",
);

export const parts = anatomy.build();
