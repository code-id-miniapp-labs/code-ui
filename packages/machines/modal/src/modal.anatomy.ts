import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("modal").parts(
    "root",
    "trigger",
    "overlay",
    "container",
    "content",
    "header",
    "wrapper",
    "title",
    "description",
    "closeTrigger",
    "closeButton",
    "closeIcon",
    "body",
    "footer",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
