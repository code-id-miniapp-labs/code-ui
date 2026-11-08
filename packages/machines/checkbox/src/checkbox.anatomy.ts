import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("checkbox").parts(
    "root",
    "base",
    "indicator",
    "icon",
    "wrapper",
    "label",
    "description",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
