import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("pin-input").parts(
    "root",
    "control",
    "input",
    "label",
    "separator",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
