import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("qr-code").parts("root", "frame", "pattern", "overlay"))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
