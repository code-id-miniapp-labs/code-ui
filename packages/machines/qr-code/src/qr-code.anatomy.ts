import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("qr-code").parts(
  "root",
  "frame",
  "pattern",
  "overlay",
);

export const parts = anatomy.build();
