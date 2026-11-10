import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("banner").parts(
    "root",
    "wrapper",
    "title",
    "description",
    "icon",
    "actions",
    "action",
    "closeTrigger",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();

