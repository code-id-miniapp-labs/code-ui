import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("checkbox-group").parts(
    "root",
    "fieldset",
    "legend",
    "item",
    "base",
    "indicator",
    "wrapper",
    "label",
    "description",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
