import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("input").parts(
    "root",
    "base",
    "nativeInput",
    "leading",
    "leadingIcon",
    "trailing",
    "trailingIcon",
    "clear",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
