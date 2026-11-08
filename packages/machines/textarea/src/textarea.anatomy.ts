import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("textarea").parts(
    "root",
    "base",
    "placeholder",
    "leading",
    "leadingIcon",
    "trailing",
    "trailingIcon",
    "clear",
    "count",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
