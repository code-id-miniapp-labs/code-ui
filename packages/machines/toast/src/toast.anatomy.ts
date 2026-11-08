import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("toast").parts(
    "root",
    "wrapper",
    "title",
    "description",
    "icon",
    "actions",
    "action",
    "closeTrigger",
    "progress",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();

