import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("toast").parts(
    "root",
    "tint",
    "wrapper",
    "title",
    "description",
    "iconWrapper",
    "icon",
    "actions",
    "action",
    "closeTrigger",
    "closeButton",
    "closeIcon",
    "progress",
    "progressBar",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();

