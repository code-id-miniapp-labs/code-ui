import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("banner").parts(
    "root",
    "body",
    "background",
    "content",
    "title",
    "description",
    "caption",
    "badge",
    "imageArea",
    "image",
    "icon",
    "buttonArea",
    "close",
    "more",
    "actions",
    "action",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();
