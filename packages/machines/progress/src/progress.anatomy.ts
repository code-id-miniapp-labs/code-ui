import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("progress").parts(
    "root",
    "label",
    "track",
    "range",
    "valueText",
    "view",
    "circle",
    "circleRange",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
