import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("swipe-cell").parts(
    "root",
    "wrapper",
    "left",
    "content",
    "right",
    "action",
    "actionText",
    "actionIcon",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();

