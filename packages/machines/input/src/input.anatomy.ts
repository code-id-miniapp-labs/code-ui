import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("input").parts(
    "root",
    "base",
    "leading",
    "leadingIcon",
    "trailing",
    "trailingIcon",
    "clear",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
