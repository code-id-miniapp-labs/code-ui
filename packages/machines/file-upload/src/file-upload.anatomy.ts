import { createAnatomy } from "@code-id-labs/anatomy";

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
    "fileImage",
    "fileContent",
    "fileName",
    "fileSize",
    "fileTrailing",
    "fileRemove",
    "fileProgress",
    "previewOverlay",
    "previewHeader",
    "previewCounter",
    "previewClose",
    "previewCloseIcon",
    "previewSwiper",
    "previewSlide",
    "previewImage",
    "previewFooter",
    "previewName",
    "previewMeta",
  ))();

export const parts = /* @__PURE__ */ (() => anatomy.build())();

