import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("switch").parts(
    "root",
    "base",
    "container",
    "thumb",
    "icon",
    "wrapper",
    "label",
    "description",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
