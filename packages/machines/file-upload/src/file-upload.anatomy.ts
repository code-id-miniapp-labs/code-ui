import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = /* @__PURE__ */ (() =>
  createAnatomy("file-upload").parts(
    "root",
    "dropzone",
    "icon",
    "content",
    "title",
    "description",
    "fileList",
    "file",
    "fileLeading",
    "fileContent",
    "fileName",
    "fileSize",
    "fileTrailing",
    "fileRemove",
    "fileProgress",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();

