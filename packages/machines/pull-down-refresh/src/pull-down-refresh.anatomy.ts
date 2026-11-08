import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("pull-down-refresh").parts(
    "root",
    "header",
    "track",
    "tips",
    "indicator",
    "text",
    "content",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
