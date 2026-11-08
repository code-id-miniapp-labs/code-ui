import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("form").parts("root", "errors", "error"))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
