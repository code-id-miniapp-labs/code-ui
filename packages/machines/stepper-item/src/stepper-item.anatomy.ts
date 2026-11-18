import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("stepper-item").parts(
    "root",
    "container",
    "trigger",
    "indicator",
    "icon",
    "separator",
    "wrapper",
    "title",
    "description",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
