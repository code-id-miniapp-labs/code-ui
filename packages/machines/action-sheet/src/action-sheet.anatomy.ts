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
    "itemText",
    "itemTitle",
    "itemLabel",
    "itemDescription",
    "itemIcon",
    "gap",
    "actions",
    "action",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
