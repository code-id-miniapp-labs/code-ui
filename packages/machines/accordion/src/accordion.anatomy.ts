import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("accordion").parts(
    "root",
    "item",
    "header",
    "trigger",
    "leading",
    "leadingIcon",
    "label",
    "trailing",
    "trailingIcon",
    "content",
    "body",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();

