import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("tabs-item").parts(
    "root",
    "content",
    "trigger",
    "leading",
    "label",
    "trailing",
    "indicator",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
