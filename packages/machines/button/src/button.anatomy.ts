import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("button").parts(
  "root",
  "label",
  "icon",
  "spinner"
);

export const parts = anatomy.build();
