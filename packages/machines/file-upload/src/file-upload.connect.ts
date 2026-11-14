import type { MiniAppBaseEventLike } from "@code-ui/utils";
import type {
  FileUploadApi,
  FileUploadFile,
  FileUploadItemView,
  FileUploadService,
} from "./file-upload.types";
import * as dom from "./file-upload.dom";
import {
  formatBytes,
  getFileThumbKey,
  getFileType,
  resolveFileThumb,
} from "./file-upload.utils";

export {
  formatBytes,
  getFileType,
  hasDocumentExtension,
  isImageFile,
  isVideoFile,
  isAudioFile,
} from "./file-upload.utils";

function getEventIndex(
  event: MiniAppBaseEventLike<{ index: number }> | undefined,
  fallback = -1,
): number {
  const raw = event?.currentTarget?.dataset?.index;
  return raw !== undefined ? Number(raw) : fallback;
}

export function connectFileUpload(service: FileUploadService): FileUploadApi {
  const { state, send, context, computed, prop, scope } = service;

  const currentState = state.get();
  const files = context.get("files");
  const failedThumbs = context.get("failedThumbs");
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const invalid = computed("isInvalid");
  const interactive = computed("isInteractive");
  const isMaxFiles = computed("isMaxFiles");
  const hasFiles = computed("hasFiles");
  const fileCount = computed("fileCount");
  const isUploading = computed("isUploading");
  const progress = prop("progress");
  const maxFiles = prop("maxFiles");

  const dropzoneAriaLabel = isMaxFiles
    ? `Maximum ${maxFiles} files uploaded`
    : `Upload files, ${fileCount} of ${maxFiles} files selected`;

  const items: FileUploadItemView[] = files.map((file, index) => {
    const fileType = getFileType(file);
    const fileId = file.id || String(index);
    const itemProgress = file.progress ?? progress ?? null;
    const thumb = resolveFileThumb(file, fileType);
    const thumbKey = getFileThumbKey(file, thumb);
    const thumbFailed = Boolean(thumbKey && failedThumbs.includes(thumbKey));

    return Object.assign({}, file, {
      index,
      thumb,
      thumbFailed,
      progress: itemProgress,
      formattedSize: formatBytes(file.size),
      fileType,
      itemProps: {
        id: dom.getFileId(scope, fileId),
        "aria-role": "listitem",
      },
      removeProps: {
        id: dom.getFileRemoveId(scope, fileId),
        "aria-role": "button",
        "aria-label": `Remove ${file.name}`,
      },
      previewProps: {
        id: dom.getFilePreviewId(scope, fileId),
        "aria-role": "button",
        "aria-label": `Preview ${file.name}`,
      },
    });
  });

  const chooseFiles = (): Promise<void> =>
    new Promise<void>((resolve) => {
      send({ type: "CHOOSE", onDone: resolve });
    });

  return {
    state: currentState,
    files: items,
    fileCount,
    hasFiles,
    isMaxFiles,
    isUploading,
    progress,
    disabled,
    readOnly,
    invalid,
    interactive,
    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      "data-max": String(isMaxFiles),
      "aria-role": "group",
      "aria-disabled": disabled,
      "aria-invalid": invalid,
    },
    dropzoneProps: {
      id: dom.getDropzoneId(scope),
      "data-state": currentState,
      "data-disabled": String(disabled || isMaxFiles),
      "data-readonly": String(readOnly),
      "data-max": String(isMaxFiles),
      "aria-role": "button",
      "aria-disabled": disabled || isMaxFiles,
      "aria-busy": isUploading,
      "aria-label": dropzoneAriaLabel,
    },
    fileListProps: {
      id: dom.getFileListId(scope),
      "aria-role": "list",
      "aria-label": "Uploaded files",
    },
    chooseFiles,
    handleDropzoneTap: () => chooseFiles(),
    addFiles: (rawFiles: unknown[]) => {
      send({ type: "PICKED_RAW", files: rawFiles });
    },
    removeFile: (idOrIndex: string | number) => {
      send({ type: "REMOVE_FILE", idOrIndex });
    },
    handleRemove: (event: MiniAppBaseEventLike<{ index: number }>) => {
      const index = getEventIndex(event);
      if (index >= 0) {
        send({ type: "REMOVE_FILE", index });
      }
    },
    previewFile: (idOrIndex: string | number) => {
      send({ type: "PREVIEW_FILE", idOrIndex });
    },
    handlePreview: (event: MiniAppBaseEventLike<{ index: number }>) => {
      const index = getEventIndex(event);
      if (index >= 0) {
        send({ type: "PREVIEW_FILE", idOrIndex: index });
      }
    },
    handleFileClick: (event: MiniAppBaseEventLike<{ index: number }>) => {
      const index = getEventIndex(event);
      if (index >= 0) {
        send({ type: "FILE_CLICK", index });
      }
    },
    handleImageError: (event: MiniAppBaseEventLike<{ index: number }>) => {
      const index = getEventIndex(event);
      if (index >= 0) {
        send({ type: "IMAGE_ERROR", index });
      }
    },
    clearFiles: () => {
      send({ type: "CLEAR_FILES" });
    },
    setFiles: (newFiles: FileUploadFile[]) => {
      send({ type: "SET_VALUE", value: newFiles });
    },
  };
}
