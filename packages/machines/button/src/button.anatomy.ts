import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("button").parts("root", "label", "icon", "spinner"))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
