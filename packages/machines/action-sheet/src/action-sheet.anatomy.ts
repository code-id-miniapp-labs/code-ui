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
    "closeButton",
    "closeIcon",
    "body",
    "item",
    "itemHover",
    "itemText",
    "itemTitle",
    "itemLabel",
    "itemLabelDestructive",
    "itemDescription",
    "itemIcon",
    "itemIconDestructive",
    "itemLoadingIcon",
    "gap",
    "actions",
    "action",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
