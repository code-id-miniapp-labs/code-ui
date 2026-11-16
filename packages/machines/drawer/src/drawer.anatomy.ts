import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("drawer").parts(
    "root",
    "trigger",
    "backdrop",
    "positioner",
    "content",
    "title",
    "description",
    "closeTrigger",
    "closeButton",
    "closeIcon",
    "grabber",
    "header",
    "headerContent",
    "body",
    "footer",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
