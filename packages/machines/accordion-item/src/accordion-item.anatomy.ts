import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("accordion-item").parts(
    "root",
    "header",
    "trigger",
    "leading",
    "leadingIcon",
    "label",
    "description",
    "trailing",
    "trailingIcon",
    "content",
    "body",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();

