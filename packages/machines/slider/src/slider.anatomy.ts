import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("slider").parts(
    "root",
    "label",
    "valueText",
    "wrapper",
    "control",
    "track",
    "range",
    "thumb",
    "markerGroup",
    "marker",
    "markerTick",
    "markerLabel",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();

