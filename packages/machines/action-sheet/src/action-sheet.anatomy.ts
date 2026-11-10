import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("action-sheet").parts(
    "root",
    "backdrop",
    "content",
    "header",
    "title",
    "description",
    "closeTrigger",
    "body",
    "item",
    "itemLabel",
    "itemDescription",
    "itemIcon",
    "gap",
    "cancel",
    "cancelText",
    "cancelIcon",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
