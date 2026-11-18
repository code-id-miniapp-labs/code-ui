import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("tabs").parts("root", "list", "content"))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
