import { createAnatomy } from "@code-ui/anatomy";

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
