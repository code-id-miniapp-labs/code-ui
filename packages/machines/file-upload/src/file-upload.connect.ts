import type {
  FileUploadApi,
  FileUploadFile,
  FileUploadItemView,
  FileUploadService,
} from "./file-upload.types";
import * as dom from "./file-upload.dom";
import {
  cleanExtensions,
  formatBytes,
  getFileType,
  hasDocumentExtension,
  isAudioFile,
  isImageFile,
  isVideoFile,
  validateFiles,
} from "./file-upload.utils";

export {
  formatBytes,
  getFileType,
  hasDocumentExtension,
  isImageFile,
  isVideoFile,
  isAudioFile,
} from "./file-upload.utils";

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

let activeAudioCtx: any = null;
let activeAudioPath: string | null = null;

export function stopActiveAudio(): void {
  if (activeAudioCtx) {
    try {
      activeAudioCtx.stop();
      activeAudioCtx.destroy();
    } catch {
      // Audio context may already be closed
    }
    activeAudioCtx = null;
    activeAudioPath = null;
  }
}

function playAudio(file: FileUploadFile, wxApi: any): void {
  if (typeof wxApi.createInnerAudioContext !== "function") return;

  // Toggle play/pause if the same audio file is clicked
  if (activeAudioCtx && activeAudioPath === file.path) {
    if (activeAudioCtx.paused) {
      activeAudioCtx.play();
      wxApi.showToast?.({
        title: `Playing ${file.name}`,
        icon: "none",
        duration: 1500,
      });
    } else {
      activeAudioCtx.pause();
      wxApi.showToast?.({
        title: `Paused ${file.name}`,
        icon: "none",
        duration: 1500,
      });
    }
    return;
  }

  stopActiveAudio();

  const audio = wxApi.createInnerAudioContext();
  activeAudioCtx = audio;
  activeAudioPath = file.path || "";
  audio.src = file.path;
  audio.autoplay = true;

  audio.onPlay(() => {
    wxApi.showToast?.({
      title: `Playing ${file.name}`,
      icon: "none",
      duration: 1500,
    });
  });

  audio.onEnded(() => {
    activeAudioPath = null;
  });

  audio.onError((err: any) => {
    console.warn("[file-upload] Audio playback error:", err);
    wxApi.showToast?.({
      title: "Audio playback error",
      icon: "none",
      duration: 2000,
    });
  });

  audio.play();
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
  const progress = prop("progress");
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
    const fileType = getFileType(file);
    const fileId = file.id || String(index);
    const itemProgress = file.progress ?? progress ?? undefined;

    return {
      ...file,
      index,
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
    };
  });

  const handlePickedFiles = (rawFiles: any[]) => {
    const mapped: FileUploadFile[] = rawFiles.map((item) => {
      const path = item.tempFilePath || item.path || "";
      const name = item.name || path.split("/").pop() || `file-${Date.now()}`;
      const size = item.size ?? 0;
      const type =
        item.fileType ||
        item.type ||
        (isImageFile(undefined, path, name)
          ? "image"
          : isVideoFile(undefined, path, name)
            ? "video"
            : isAudioFile(undefined, path, name)
              ? "audio"
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

    const { accepted, rejected } = validateFiles(mapped, {
      maxSize,
      minSize,
      accept,
      maxFiles,
      multiple,
      currentCount: files.length,
    });

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
    const acceptStr = (
      Array.isArray(accept) ? accept.join(",") : accept || ""
    ).toLowerCase();
    const hasDoc = hasDocumentExtension(acceptStr);

    if (mode === "messageFile" || (mode === "auto" && hasDoc)) {
      if (typeof wxApi.chooseMessageFile === "function") {
        const cleanExts = cleanExtensions(accept);

        wxApi.chooseMessageFile({
          count: remainingSlots,
          type: cleanExts.length > 0 ? "file" : "all",
          extension: cleanExts.length > 0 ? cleanExts : undefined,
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
      const target = files[index];
      if (target?.path && target.path === activeAudioPath) {
        stopActiveAudio();
      }
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

    const fileType = getFileType(file);
    if (fileType === "image") {
      if (typeof wxApi.previewImage === "function") {
        const imageUrls = files
          .filter((f) => getFileType(f) === "image" && f.path)
          .map((f) => f.path as string);
        wxApi.previewImage({
          current: file.path,
          urls: imageUrls.length > 0 ? imageUrls : [file.path],
        });
      }
    } else if (fileType === "video") {
      if (typeof wxApi.previewMedia === "function") {
        wxApi.previewMedia({
          current: 0,
          sources: [
            {
              url: file.path,
              type: "video",
              poster: file.thumb || "",
            },
          ],
          fail: (err: any) => {
            console.warn("[file-upload] previewMedia failed:", err);
          },
        });
      }
    } else if (fileType === "audio") {
      playAudio(file, wxApi);
    } else {
      if (typeof wxApi.openDocument === "function") {
        wxApi.openDocument({
          filePath: file.path,
          showMenu: true,
          fail: (err: any) => {
            console.warn("[file-upload] openDocument failed:", err);
          },
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
    stopActiveAudio();
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
    handleDropzoneTap: async (_event: any) => {
      await chooseFiles();
    },
    addFiles: (rawFiles: any[]) => {
      if (!interactive) return;
      handlePickedFiles(rawFiles);
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
