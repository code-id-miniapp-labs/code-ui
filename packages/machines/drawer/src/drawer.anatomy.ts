import { createAnatomy } from "@code-id-labs/anatomy";

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
    "grabberBar",
    "container",
    "header",
    "headerContent",
    "body",
    "footer",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
