import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("form-field").parts(
    "root",
    "labelWrapper",
    "label",
    "required",
    "hint",
    "description",
    "container",
    "help",
    "error",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
