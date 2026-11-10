import type {
  FileUploadApi,
  FileUploadFile,
  FileUploadItemView,
  FileUploadRejectedFile,
  FileUploadService,
} from "./file-upload.types";
import * as dom from "./file-upload.dom";

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

export function isImageFile(
  type?: string,
  path?: string,
  name?: string,
): boolean {
  if (type === "image" || type?.startsWith("image/")) return true;
  const check = (path || name || "").toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(check);
}

export function isVideoFile(
  type?: string,
  path?: string,
  name?: string,
): boolean {
  if (type === "video" || type?.startsWith("video/")) return true;
  const check = (path || name || "").toLowerCase();
  return /\.(mp4|mov|m4v|avi|mkv|webm)$/.test(check);
}

function matchesAccept(
  file: FileUploadFile,
  accept: string | string[],
): boolean {
  if (!accept) return true;
  const acceptList = Array.isArray(accept)
    ? accept
    : accept.split(",").map((s) => s.trim().toLowerCase());

  const fileName = (file.name || "").toLowerCase();
  const filePath = (file.path || "").toLowerCase();
  const fileType = (file.type || "").toLowerCase();

  return acceptList.some((pattern) => {
    if (!pattern) return true;
    if (pattern === "*/*") return true;
    if (pattern.startsWith(".")) {
      return fileName.endsWith(pattern) || filePath.endsWith(pattern);
    }
    if (pattern.endsWith("/*")) {
      const category = pattern.slice(0, -2);
      return (
        fileType.startsWith(category) ||
        (category === "image" && isImageFile(fileType, filePath, fileName)) ||
        (category === "video" && isVideoFile(fileType, filePath, fileName))
      );
    }
    return fileType === pattern;
  });
}

function getEventIndex(event: any, fallback = -1): number {
  const index =
    event?.currentTarget?.dataset?.index ??
    event?.target?.dataset?.index ??
    fallback;
  return Number(index);
}

const getWx = (): any => (globalThis as Record<string, any>).wx;

let fileIdCounter = 0;
function generateFileId(): string {
  fileIdCounter += 1;
  return `file-${Date.now()}-${fileIdCounter}`;
}

export function connectFileUpload(service: FileUploadService): FileUploadApi {
  const { state, send, context, computed, prop, scope } = service;

  const currentState = state.get();
  const files = context.get("files") ?? [];
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const invalid = computed("isInvalid");
  const interactive = computed("isInteractive");
  const isMaxFiles = computed("isMaxFiles");
  const hasFiles = computed("hasFiles");
  const fileCount = computed("fileCount");
  const isUploading = computed("isUploading");
  const maxFiles = prop("maxFiles") ?? 10;
  const multiple = Boolean(prop("multiple") ?? true);
  const maxSize = prop("maxSize") ?? Infinity;
  const minSize = prop("minSize") ?? 0;
  const accept = prop("accept");
  const mode = prop("mode") ?? "auto";

  const dropzoneAriaLabel = isMaxFiles
    ? `Maximum ${maxFiles} files uploaded`
    : `Upload files, ${fileCount} of ${maxFiles} files selected`;

  const items: FileUploadItemView[] = files.map((file, index) => {
    const isImage = isImageFile(file.type, file.path, file.name);
    const fileId = file.id || String(index);

    return {
      ...file,
      index,
      formattedSize: formatBytes(file.size),
      isImage,
      itemProps: {
        id: dom.getFileId(scope, fileId),
        "data-scope": "file-upload",
        "data-part": "file",
        "data-index": index,
        "data-status": file.status || "idle",
        "aria-role": "listitem",
      },
      removeProps: {
        id: dom.getFileRemoveId(scope, fileId),
        "data-scope": "file-upload",
        "data-part": "file-remove",
        "data-index": index,
        "aria-role": "button",
        "aria-label": `Remove ${file.name}`,
        "aria-disabled": disabled || readOnly,
      },
      previewProps: {
        id: dom.getFilePreviewId(scope, fileId),
        "data-scope": "file-upload",
        "data-part": "file-preview",
        "data-index": index,
        "aria-role": "button",
        "aria-label": `Preview ${file.name}`,
      },
    };
  });

  const handlePickedFiles = (rawFiles: any[]) => {
    const mapped: FileUploadFile[] = rawFiles.map((item) => {
      const path = item.tempFilePath || item.path || "";
      const name =
        item.name ||
        path.split("/").pop() ||
        `file-${Date.now()}`;
      const size = item.size ?? 0;
      const type =
        item.fileType ||
        item.type ||
        (isImageFile(undefined, path, name)
          ? "image"
          : isVideoFile(undefined, path, name)
            ? "video"
            : "file");
      const thumb =
        item.thumbTempFilePath ||
        (isImageFile(type, path, name) ? path : undefined);

      return {
        id: generateFileId(),
        name,
        size,
        type,
        path,
        thumb,
        duration: item.duration,
        width: item.width,
        height: item.height,
        status: "idle",
      };
    });

    const accepted: FileUploadFile[] = [];
    const rejected: FileUploadRejectedFile[] = [];

    for (const file of mapped) {
      if (file.size > maxSize) {
        rejected.push({ file, reason: "size-too-large" });
      } else if (file.size < minSize) {
        rejected.push({ file, reason: "size-too-small" });
      } else if (accept && !matchesAccept(file, accept)) {
        rejected.push({ file, reason: "type-not-allowed" });
      } else {
        accepted.push(file);
      }
    }

    if (rejected.length > 0) {
      prop("onReject")?.({ files: rejected });
    }

    if (accepted.length > 0) {
      send({ type: "ADD_FILES", files: accepted });
      prop("onAccept")?.({ files: accepted });
    }
  };

  const chooseFiles = async (): Promise<void> => {
    if (!interactive || isMaxFiles) return;

    send({ type: "CHOOSE" });

    const wxApi = getWx();
    if (!wxApi) {
      send({ type: "CHOOSE_COMPLETE" });
      return;
    }

    const remainingSlots = multiple ? Math.max(1, maxFiles - files.length) : 1;

    // Detect messageFile requirement: explicit mode or accept contains document extensions
    const acceptStr = (Array.isArray(accept) ? accept.join(",") : accept || "")
      .toLowerCase();
    const hasDocExtensions =
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|csv)/i.test(acceptStr);

    if (mode === "messageFile" || (mode === "auto" && hasDocExtensions)) {
      if (typeof wxApi.chooseMessageFile === "function") {
        wxApi.chooseMessageFile({
          count: remainingSlots,
          type: "all",
          extension: Array.isArray(accept)
            ? accept
            : accept
              ? accept.split(",").map((s) => s.trim())
              : undefined,
          success: (res: any) => {
            handlePickedFiles(res.tempFiles || []);
          },
          fail: () => {},
          complete: () => {
            send({ type: "CHOOSE_COMPLETE" });
          },
        });
        return;
      }
    }

    if (typeof wxApi.chooseMedia === "function") {
      wxApi.chooseMedia({
        count: remainingSlots,
        mediaType: prop("mediaType") ?? ["image", "video"],
        sourceType: prop("sourceType") ?? ["album", "camera"],
        maxDuration: prop("maxDuration") ?? 60,
        sizeType: prop("sizeType") ?? ["original", "compressed"],
        camera: prop("camera") ?? "back",
        success: (res: any) => {
          handlePickedFiles(res.tempFiles || []);
        },
        fail: () => {},
        complete: () => {
          send({ type: "CHOOSE_COMPLETE" });
        },
      });
      return;
    }

    if (typeof wxApi.chooseMessageFile === "function") {
      wxApi.chooseMessageFile({
        count: remainingSlots,
        type: "all",
        success: (res: any) => {
          handlePickedFiles(res.tempFiles || []);
        },
        fail: () => {},
        complete: () => {
          send({ type: "CHOOSE_COMPLETE" });
        },
      });
      return;
    }

    send({ type: "CHOOSE_COMPLETE" });
  };

  const removeFile = (idOrIndex: string | number): void => {
    if (!interactive) return;
    const index =
      typeof idOrIndex === "number"
        ? idOrIndex
        : files.findIndex((f) => f.id === idOrIndex);
    if (index >= 0) {
      send({ type: "REMOVE_FILE", index });
    }
  };

  const handleRemove = (event: any): void => {
    const index = getEventIndex(event);
    if (index >= 0) {
      removeFile(index);
    }
  };

  const previewFile = (idOrIndex: string | number): void => {
    const index =
      typeof idOrIndex === "number"
        ? idOrIndex
        : files.findIndex((f) => f.id === idOrIndex);
    if (index < 0) return;

    const file = files[index];
    if (!file) return;

    prop("onPreview")?.({ file, index });

    const wxApi = getWx();
    if (!wxApi || !file.path) return;

    if (isImageFile(file.type, file.path, file.name)) {
      if (typeof wxApi.previewImage === "function") {
        wxApi.previewImage({
          current: file.path,
          urls: [file.path],
        });
      }
    } else if (isVideoFile(file.type, file.path, file.name)) {
      if (typeof wxApi.previewMedia === "function") {
        wxApi.previewMedia({
          sources: [{ url: file.path, type: "video" }],
        });
      }
    } else {
      if (typeof wxApi.openDocument === "function") {
        wxApi.openDocument({
          filePath: file.path,
        });
      }
    }
  };

  const handlePreview = (event: any): void => {
    const index = getEventIndex(event);
    if (index >= 0) {
      previewFile(index);
    }
  };

  const handleFileClick = (event: any): void => {
    const index = getEventIndex(event);
    if (index >= 0) {
      const file = files[index];
      if (file) {
        prop("onFileClick")?.({ file, index });
      }
    }
  };

  const clearFiles = (): void => {
    if (!interactive) return;
    send({ type: "CLEAR_FILES" });
  };

  const setFiles = (newFiles: FileUploadFile[]): void => {
    send({ type: "SET_VALUE", value: newFiles });
  };

  return {
    state: currentState,
    files: items,
    fileCount,
    hasFiles,
    isMaxFiles,
    isUploading,
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
    handleDropzoneTap: async (_event: any) => {
      await chooseFiles();
    },
    removeFile,
    handleRemove,
    previewFile,
    handlePreview,
    handleFileClick,
    clearFiles,
    setFiles,
  };
}
