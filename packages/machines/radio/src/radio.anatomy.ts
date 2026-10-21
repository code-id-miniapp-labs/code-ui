import { createAnatomy } from "@code-ui/anatomy";

export const radioAnatomy = createAnatomy("radio").parts(
  "root",
  "base",
  "indicator",
  "wrapper",
  "label",
  "description",
);

export const radioParts = radioAnatomy.build();
