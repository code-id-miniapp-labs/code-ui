import { createAnatomy } from "@code-ui/anatomy";

export const radioAnatomy = /* @__PURE__ */ (() =>
  createAnatomy("radio").parts(
    "root",
    "base",
    "indicator",
    "wrapper",
    "label",
    "description",
  ))();

export const radioParts = /* @__PURE__ */ (() => radioAnatomy.build())();
