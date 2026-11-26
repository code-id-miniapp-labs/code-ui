import { createMachine } from "@code-id-labs/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-id-labs/form/context";
import { isEqual, isNotEmpty, isNotNull } from "@code-id-labs/utils";
import type {
  FileUploadFile,
  FileUploadMachine,
  FileUploadSchema,
} from "./file-upload.types";
import { defaultFileUploadProps } from "./file-upload.props";
import * as dom from "./file-upload.dom";
import {
  cleanExtensions,
  detectImageMimeFromBase64,
  getFileMimeType,
  getFileThumbKey,
  getFileType,
  hasDocumentExtension,
  isAudioFile,
  isImageFile,
  isLocalFilePath,
  isRemoteHttpUrl,
  isVideoFile,
  resolveFileThumb,
  validateFiles,
} from "./file-upload.utils";

const COMPRESS_THRESHOLD_BYTES = 300 * 1024;
const MAX_INLINE_BASE64_LENGTH = 6 * 1024 * 1024;

declare const wx: Record<string, any> | undefined;

const getWx = (): any =>
  typeof wx !== "undefined" && wx
    ? wx
    : (globalThis as Record<string, unknown>).wx;

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

  audio.onError((err: unknown) => {
    console.warn("[file-upload] Audio playback error:", err);
    wxApi.showToast?.({
      title: "Audio playback error",
      icon: "none",
      duration: 2000,
    });
  });

  audio.play();
}

interface RawPickedFileLike {
  tempFilePath?: string | undefined;
  path?: string | undefined;
  name?: string | undefined;
  size?: number | undefined;
  fileType?: string | undefined;
  type?: string | undefined;
  thumbTempFilePath?: string | undefined;
  duration?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
}

function mapRawPickedFiles(rawFiles: unknown[]): FileUploadFile[] {
  return rawFiles.map((raw) => {
    const item = (raw ?? {}) as RawPickedFileLike;
    const path = item.tempFilePath || item.path || "";
    const name = item.name || path.split("/").pop() || `file-${Date.now()}`;
    const size = item.size ?? 0;
    const explicitType =
      item.fileType ||
      (item.type && item.type !== "file" ? item.type : undefined);
    const type =
      explicitType ||
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
}

function appendValidatedFiles(
  current: FileUploadFile[],
  incoming: FileUploadFile[],
  maxFiles: number,
  multiple: boolean,
): FileUploadFile[] {
  if (!multiple) {
    return incoming.slice(0, 1);
  }
  const remainingSlots = Math.max(0, maxFiles - current.length);
  if (remainingSlots <= 0) return current;
  return [...current, ...incoming.slice(0, remainingSlots)];
}

export const fileUploadMachine: FileUploadMachine =
  createMachine<FileUploadSchema>({
    props: ({ props }) => ({
      ...defaultFileUploadProps,
      ...props,
    }),

    initialState: ({ prop }) => (prop("uploading") ? "uploading" : "idle"),

    refs: ({ prop }) => ({
      initialFiles: prop("value") ?? prop("defaultValue"),
      formField: undefined,
      chooseDone: undefined,
      resolvingPaths: new Set<string>(),
      actionSheetTimer: undefined,
      disposed: false,
    }),

    context: ({ prop, bindable, getRefs }) => ({
      files: bindable<FileUploadFile[]>(() => {
        const controlledVal = prop("value");
        const defaultVal = prop("defaultValue");

        return {
          value: isNotNull(controlledVal) ? controlledVal : undefined,
          defaultValue: controlledVal ?? defaultVal,
          isEqual,
          onChange: (nextVal) => {
            prop("onChange")?.({ value: nextVal });

            const formField = getRefs().get("formField");
            if (formField) {
              formField.emitInput(nextVal);
              formField.emitChange(nextVal);
            }
          },
        };
      }),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      failedThumbs: bindable<string[]>(() => ({
        defaultValue: [],
      })),

      resolvedSources: bindable<Record<string, string>>(() => ({
        defaultValue: {},
      })),

      previewOpen: bindable<boolean>(() => ({
        defaultValue: false,
      })),

      previewIndex: bindable<number>(() => ({
        defaultValue: 0,
      })),
    }),

    computed: {
      ...createFormFieldComputed("fileUpload"),
      isInvalid: ({ prop, refs, context, scope }) =>
        Boolean(
          context.get("invalid") ||
          hasFormFieldErrors(prop, refs, scope, "fileUpload"),
        ),
      isDisabled: ({ prop, computed }) =>
        Boolean(
          computed("formDisabled") ||
          computed("fieldDisabled") ||
          prop("disabled"),
        ),
      isReadOnly: ({ prop, computed }) =>
        Boolean(prop("readOnly") || computed("formReadOnly")),
      isInteractive: ({ computed, prop }) =>
        !computed("isDisabled") &&
        !computed("isReadOnly") &&
        prop("interactive"),
      isMaxFiles: ({ context, prop }) =>
        context.get("files").length >= prop("maxFiles"),
      hasFiles: ({ context }) => context.get("files").length > 0,
      fileCount: ({ context }) => context.get("files").length,
      isUploading: ({ prop, state }) =>
        prop("uploading") || state.matches("uploading"),
    },

    watch: ({ prop, send, track }) => {
      track([() => prop("uploading")], () => {
        send({ type: "SET_UPLOADING", uploading: prop("uploading") });
      });
    },

    effects: ["hydrateLocalImages"],
    entry: ["setupFormField"],
    exit: [
      "markDisposed",
      "cleanupFormField",
      "cleanupAudio",
      "flushChooseCallback",
    ],

    on: {
      SET_VALUE: {
        actions: ["setValue"],
      },
      ADD_FILES: {
        guard: "canAddFiles",
        actions: ["addFiles"],
      },
      PICKED_RAW: {
        guard: "canAddFiles",
        actions: ["ingestPickedFiles"],
      },
      REMOVE_FILE: {
        guard: "isInteractive",
        actions: ["removeFile"],
      },
      PREVIEW_FILE: {
        actions: ["previewFile"],
      },
      PREVIEW_CLOSE: {
        actions: ["closePreview"],
      },
      PREVIEW_CHANGE: {
        actions: ["setPreviewIndex"],
      },
      FILE_CLICK: {
        actions: ["clickFile"],
      },
      IMAGE_ERROR: {
        actions: ["markImageError"],
      },
      CLEAR_FILES: {
        guard: "isInteractive",
        actions: ["cleanupAudio", "clearFiles"],
      },
    },

    states: {
      idle: {
        tags: ["idle"],
        on: {
          CHOOSE: [
            {
              guard: "canChoose",
              target: "choosing",
              actions: ["setChooseCallback"],
            },
            {
              actions: ["resolveChooseFromEvent"],
            },
          ],
          SET_UPLOADING: {
            guard: "isUploadingTrue",
            target: "uploading",
          },
        },
      },
      choosing: {
        tags: ["busy"],
        effects: ["pickWeChatFiles"],
        exit: ["flushChooseCallback"],
        on: {
          CHOOSE: {
            actions: ["resolveChooseFromEvent"],
          },
          CHOOSE_COMPLETE: {
            target: "idle",
          },
          SET_UPLOADING: {
            guard: "isUploadingTrue",
            target: "uploading",
          },
        },
      },
      uploading: {
        tags: ["busy"],
        on: {
          CHOOSE: {
            actions: ["resolveChooseFromEvent"],
          },
          SET_UPLOADING: {
            guard: "isUploadingFalse",
            target: "idle",
          },
        },
      },
    },

    implementations: {
      guards: {
        isInteractive: ({ computed }) => computed("isInteractive"),
        canChoose: ({ computed }) =>
          computed("isInteractive") && !computed("isMaxFiles"),
        canAddFiles: ({ computed }) =>
          computed("isInteractive") && !computed("isMaxFiles"),
        isUploadingTrue: ({ event }) =>
          event.type === "SET_UPLOADING" && Boolean(event.uploading),
        isUploadingFalse: ({ event }) =>
          event.type === "SET_UPLOADING" && !event.uploading,
      },

      effects: {
        hydrateLocalImages: ({ context, refs, track }) => {
          track(
            [
              () => {
                const rawFiles = context.get("files");
                const files = Array.isArray(rawFiles) ? rawFiles : [];
                return files
                  .map((f) => `${f.id ?? ""}:${f.path ?? ""}:${f.thumb ?? ""}`)
                  .join("|");
              },
            ],
            () => {
              if (refs.get("disposed")) return;
              const rawFiles = context.get("files");
              const files = Array.isArray(rawFiles) ? rawFiles : [];
              const resolving = refs.get("resolvingPaths");
              const currentResolved = context.get("resolvedSources");

              const activeLocalPaths = new Set<string>();
              const candidates: Array<{
                rawPath: string;
                file: FileUploadFile;
              }> = [];

              for (const file of files) {
                const fileType = getFileType(file);
                if (fileType === "image" && isLocalFilePath(file.path)) {
                  const rawPath = file.path as string;
                  activeLocalPaths.add(rawPath);
                  candidates.push({ rawPath, file });
                }
                if (
                  file.thumb &&
                  file.thumb !== file.path &&
                  isLocalFilePath(file.thumb)
                ) {
                  activeLocalPaths.add(file.thumb);
                  candidates.push({ rawPath: file.thumb, file });
                }
              }

              // Prune stale resolved entries when files are removed or replaced
              let pruned = false;
              const nextResolved: Record<string, string> = {};
              for (const key of Object.keys(currentResolved)) {
                if (activeLocalPaths.has(key)) {
                  nextResolved[key] = currentResolved[key] as string;
                } else {
                  pruned = true;
                }
              }
              for (const key of Array.from(resolving)) {
                if (!activeLocalPaths.has(key)) {
                  resolving.delete(key);
                }
              }
              if (pruned) {
                context.set("resolvedSources", nextResolved);
              }

              const wxApi = getWx();
              if (!wxApi || typeof wxApi.getFileSystemManager !== "function") {
                return;
              }
              const fs = wxApi.getFileSystemManager();
              if (!fs || typeof fs.readFile !== "function") return;

              for (const { rawPath, file } of candidates) {
                if (currentResolved[rawPath] || resolving.has(rawPath))
                  continue;
                resolving.add(rawPath);

                const readAsDataUri = (targetPath: string) => {
                  if (refs.get("disposed")) return;
                  fs.readFile({
                    filePath: targetPath,
                    encoding: "base64",
                    success: (res: { data?: string | ArrayBuffer }) => {
                      if (refs.get("disposed")) return;
                      const base64 =
                        typeof res?.data === "string" ? res.data : "";
                      if (!base64 || base64.length > MAX_INLINE_BASE64_LENGTH) {
                        return;
                      }
                      const hintMime = getFileMimeType(
                        file.name || rawPath,
                        "image/jpeg",
                      );
                      const mime = detectImageMimeFromBase64(base64, hintMime);
                      const dataUri = `data:${mime};base64,${base64}`;
                      const prev = context.get("resolvedSources");
                      if (prev[rawPath] !== dataUri) {
                        context.set("resolvedSources", {
                          ...prev,
                          [rawPath]: dataUri,
                        });
                        const oldKey = getFileThumbKey(file, rawPath);
                        if (oldKey) {
                          const prevFailed = context.get("failedThumbs");
                          if (prevFailed.includes(oldKey)) {
                            context.set(
                              "failedThumbs",
                              prevFailed.filter((k) => k !== oldKey),
                            );
                          }
                        }
                      }
                    },
                    fail: (err: unknown) => {
                      console.warn(
                        "[file-upload] Failed to read local preview image:",
                        err,
                      );
                    },
                  });
                };

                const shouldCompress =
                  (file.size > COMPRESS_THRESHOLD_BYTES || !file.size) &&
                  typeof wxApi.compressImage === "function";
                if (shouldCompress) {
                  wxApi.compressImage({
                    src: rawPath,
                    quality: 75,
                    compressedWidth: 1280,
                    success: (res: { tempFilePath?: string }) => {
                      readAsDataUri(res?.tempFilePath || rawPath);
                    },
                    fail: () => {
                      readAsDataUri(rawPath);
                    },
                  });
                } else {
                  readAsDataUri(rawPath);
                }
              }
            },
          );
        },

        pickWeChatFiles: ({ prop, context, send, refs }) => {
          const wxApi = getWx();
          if (!wxApi) {
            send({ type: "CHOOSE_COMPLETE" });
            return;
          }

          const multiple = prop("multiple");
          const maxFiles = prop("maxFiles");
          const accept = prop("accept");
          const mode = prop("mode");
          const files = context.get("files");
          const remainingSlots = multiple
            ? Math.max(1, maxFiles - files.length)
            : 1;

          const acceptStr = (
            Array.isArray(accept) ? accept.join(",") : accept
          ).toLowerCase();
          const hasDoc = hasDocumentExtension(acceptStr);

          const runChooseMessageFile = () => {
            if (typeof wxApi.chooseMessageFile !== "function") {
              send({ type: "CHOOSE_COMPLETE" });
              return;
            }
            const cleanExts = cleanExtensions(accept);
            const useFileFilter =
              cleanExts.length > 0 && !acceptStr.includes("*");
            wxApi.chooseMessageFile({
              count: remainingSlots,
              type: useFileFilter ? "file" : "all",
              ...(useFileFilter ? { extension: cleanExts } : {}),
              success: (res: { tempFiles?: unknown[] }) => {
                send({ type: "PICKED_RAW", files: res.tempFiles ?? [] });
              },
              fail: (err: { errMsg?: string }) => {
                const msg = err?.errMsg ?? "";
                if (msg && !msg.includes("cancel")) {
                  console.warn("[file-upload] chooseMessageFile failed:", err);
                  wxApi.showToast?.({
                    title: "Unable to open file picker",
                    icon: "none",
                  });
                }
              },
              complete: () => {
                send({ type: "CHOOSE_COMPLETE" });
              },
            });
          };

          const runChooseMedia = (
            overrideSourceType?: Array<"album" | "camera">,
          ) => {
            if (typeof wxApi.chooseMedia !== "function") {
              runChooseMessageFile();
              return;
            }
            wxApi.chooseMedia({
              count: remainingSlots,
              mediaType: prop("mediaType"),
              sourceType: overrideSourceType ?? prop("sourceType"),
              maxDuration: prop("maxDuration"),
              sizeType: prop("sizeType"),
              camera: prop("camera"),
              success: (res: { tempFiles?: unknown[] }) => {
                send({ type: "PICKED_RAW", files: res.tempFiles ?? [] });
              },
              fail: (err: { errMsg?: string }) => {
                const msg = err?.errMsg ?? "";
                if (msg && !msg.includes("cancel")) {
                  console.warn("[file-upload] chooseMedia failed:", err);
                }
              },
              complete: () => {
                send({ type: "CHOOSE_COMPLETE" });
              },
            });
          };

          if (mode === "messageFile" || (mode === "auto" && hasDoc)) {
            if (typeof wxApi.chooseMessageFile === "function") {
              runChooseMessageFile();
              return;
            }
          }

          const configuredSourceType = prop("sourceType");
          const hasBothSources =
            Array.isArray(configuredSourceType) &&
            configuredSourceType.includes("album") &&
            configuredSourceType.includes("camera");
          const isUnrestrictedAccept =
            !acceptStr || acceptStr === "*" || acceptStr === "*/*";

          if (
            mode === "auto" &&
            typeof wxApi.showActionSheet === "function" &&
            typeof wxApi.chooseMedia === "function"
          ) {
            if (
              isUnrestrictedAccept &&
              typeof wxApi.chooseMessageFile === "function"
            ) {
              wxApi.showActionSheet({
                itemList: [
                  "Photo / Video Album",
                  "Take Photo / Video",
                  "Choose Files",
                ],
                success: (res: { tapIndex?: number }) => {
                  // Delay slightly on iOS so UIKit finishes dismissing ActionSheet
                  // before presenting media/document picker.
                  const prevTimer = refs.get("actionSheetTimer");
                  if (prevTimer !== undefined) clearTimeout(prevTimer);
                  const timer = setTimeout(() => {
                    refs.set("actionSheetTimer", undefined);
                    if (refs.get("disposed")) return;
                    if (res.tapIndex === 2) {
                      runChooseMessageFile();
                    } else if (res.tapIndex === 1) {
                      runChooseMedia(["camera"]);
                    } else {
                      runChooseMedia(["album"]);
                    }
                  }, 150);
                  refs.set("actionSheetTimer", timer);
                },
                fail: () => {
                  send({ type: "CHOOSE_COMPLETE" });
                },
              });
              return;
            }

            if (hasBothSources) {
              wxApi.showActionSheet({
                itemList: ["Choose from Album", "Take Photo / Video"],
                success: (res: { tapIndex?: number }) => {
                  const prevTimer = refs.get("actionSheetTimer");
                  if (prevTimer !== undefined) clearTimeout(prevTimer);
                  const timer = setTimeout(() => {
                    refs.set("actionSheetTimer", undefined);
                    if (refs.get("disposed")) return;
                    runChooseMedia(res.tapIndex === 1 ? ["camera"] : ["album"]);
                  }, 150);
                  refs.set("actionSheetTimer", timer);
                },
                fail: () => {
                  send({ type: "CHOOSE_COMPLETE" });
                },
              });
              return;
            }
          }

          if (typeof wxApi.chooseMedia === "function") {
            runChooseMedia();
            return;
          }

          if (typeof wxApi.chooseMessageFile === "function") {
            runChooseMessageFile();
            return;
          }

          send({ type: "CHOOSE_COMPLETE" });
        },
      },

      actions: {
        setChooseCallback: ({ refs, event }) => {
          if (event.type !== "CHOOSE") return;
          refs.set("chooseDone", event.onDone);
        },

        resolveChooseFromEvent: ({ event }) => {
          if (event.type === "CHOOSE") {
            event.onDone?.();
          }
        },

        flushChooseCallback: ({ refs }) => {
          const done = refs.get("chooseDone");
          refs.set("chooseDone", undefined);
          if (done) {
            queueMicrotask(done);
          }
        },

        setValue: ({ context, event }) => {
          if (event.type !== "SET_VALUE") return;
          const nextFiles = Array.isArray(event.value) ? event.value : [];
          context.set("files", nextFiles);
          context.set("failedThumbs", []);
          if (context.get("previewOpen")) {
            const imageCount = nextFiles.filter(
              (f) => getFileType(f) === "image" && Boolean(f.path),
            ).length;
            if (imageCount === 0) {
              context.set("previewOpen", false);
              context.set("previewIndex", 0);
            } else if (context.get("previewIndex") >= imageCount) {
              context.set("previewIndex", imageCount - 1);
            }
          }
        },

        addFiles: ({ context, event, prop }) => {
          if (event.type !== "ADD_FILES") return;
          const next = appendValidatedFiles(
            context.get("files"),
            event.files,
            prop("maxFiles"),
            prop("multiple"),
          );
          context.set("files", next);
        },

        ingestPickedFiles: ({ context, event, prop }) => {
          if (event.type !== "PICKED_RAW") return;
          const current = context.get("files");
          const maxFiles = prop("maxFiles");
          const multiple = prop("multiple");
          const mapped = mapRawPickedFiles(event.files);

          const { accepted, rejected } = validateFiles(mapped, {
            maxSize: prop("maxSize"),
            minSize: prop("minSize"),
            accept: prop("accept"),
            maxFiles,
            multiple,
            currentCount: current.length,
          });

          if (rejected.length > 0) {
            prop("onReject")?.({ files: rejected });
          }

          if (accepted.length > 0) {
            const next = appendValidatedFiles(
              current,
              accepted,
              maxFiles,
              multiple,
            );
            context.set("files", next);
            prop("onAccept")?.({ files: accepted });
          }
        },

        removeFile: ({ context, event, prop }) => {
          if (event.type !== "REMOVE_FILE") return;
          const current = context.get("files");
          const index =
            event.index !== undefined
              ? event.index
              : typeof event.idOrIndex === "number"
                ? event.idOrIndex
                : current.findIndex((f) => f.id === event.idOrIndex);
          if (index < 0 || index >= current.length) return;

          const removed = current[index];
          if (removed?.path && removed.path === activeAudioPath) {
            stopActiveAudio();
          }

          const next = current.filter((_, i) => i !== index);
          context.set("files", next);

          if (removed) {
            const resolvedSources = context.get("resolvedSources");
            const removedKey = getFileThumbKey(
              removed,
              resolveFileThumb(removed, undefined, resolvedSources),
            );
            if (removedKey) {
              const failed = context.get("failedThumbs");
              if (failed.includes(removedKey)) {
                context.set(
                  "failedThumbs",
                  failed.filter((k) => k !== removedKey),
                );
              }
            }
            if (context.get("previewOpen")) {
              const imageCount = next.filter(
                (f) => getFileType(f) === "image" && Boolean(f.path),
              ).length;
              if (imageCount === 0) {
                context.set("previewOpen", false);
                context.set("previewIndex", 0);
              } else if (context.get("previewIndex") >= imageCount) {
                context.set("previewIndex", imageCount - 1);
              }
            }
            prop("onRemove")?.({ file: removed, index });
          }
        },

        previewFile: ({ context, event, prop }) => {
          if (event.type !== "PREVIEW_FILE") return;
          const files = context.get("files");
          const index =
            typeof event.idOrIndex === "number"
              ? event.idOrIndex
              : files.findIndex((f) => f.id === event.idOrIndex);
          if (index < 0) return;

          const file = files[index];
          if (!file) return;

          prop("onPreview")?.({ file, index });

          const wxApi = getWx();
          if (!file.path) {
            wxApi?.showToast?.({
              title: "No file path available to preview",
              icon: "none",
            });
            return;
          }

          const fileType = getFileType(file);
          if (fileType === "image") {
            if (prop("previewMode") !== "native") {
              const imageFiles = files.filter(
                (f) => getFileType(f) === "image" && Boolean(f.path),
              );
              const targetIdx = Math.max(0, imageFiles.indexOf(file));
              context.set("previewIndex", targetIdx);
              context.set("previewOpen", true);
              return;
            }

            if (!wxApi) return;
            const isLocal = !isRemoteHttpUrl(file.path);
            const imageUrls = files
              .filter(
                (f) =>
                  getFileType(f) === "image" &&
                  f.path &&
                  isRemoteHttpUrl(f.path) === !isLocal,
              )
              .map((f) => f.path as string);
            const urls = imageUrls.length > 0 ? imageUrls : [file.path];
            const currentIdx = Math.max(0, urls.indexOf(file.path));

            const tryPreviewMedia = (onFail?: () => void) => {
              if (typeof wxApi.previewMedia !== "function") {
                onFail?.();
                return;
              }
              wxApi.previewMedia({
                current: currentIdx,
                sources: urls.map((url) => ({
                  url,
                  type: "image",
                })),
                fail: (err: unknown) => {
                  if (onFail) {
                    onFail();
                    return;
                  }
                  console.warn("[file-upload] previewMedia failed:", err);
                  wxApi.showToast?.({
                    title: "Unable to preview image",
                    icon: "none",
                  });
                },
              });
            };

            const tryPreviewImage = (onFail?: () => void) => {
              if (typeof wxApi.previewImage !== "function") {
                onFail?.();
                return;
              }
              wxApi.previewImage({
                current: file.path,
                urls,
                fail: (err: unknown) => {
                  if (onFail) {
                    onFail();
                    return;
                  }
                  console.warn("[file-upload] previewImage failed:", err);
                  wxApi.showToast?.({
                    title: "Unable to preview image",
                    icon: "none",
                  });
                },
              });
            };

            if (isLocal) {
              tryPreviewMedia(() => {
                tryPreviewImage();
              });
            } else {
              tryPreviewImage(() => {
                tryPreviewMedia();
              });
            }
            return;
          }

          if (!wxApi) return;

          if (fileType === "video") {
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
                fail: (err: unknown) => {
                  console.warn("[file-upload] previewMedia failed:", err);
                },
              });
            }
          } else if (fileType === "audio") {
            playAudio(file, wxApi);
          } else if (typeof wxApi.openDocument === "function") {
            const extMatch = (file.name || file.path)
              .split("?")[0]
              ?.match(/\.(doc|docx|xls|xlsx|ppt|pptx|pdf)$/i);
            const docFileType = extMatch?.[1]?.toLowerCase();
            const openLocalDocument = (
              localPath: string,
              allowUserDataRetry = true,
            ) => {
              wxApi.openDocument({
                filePath: localPath,
                ...(docFileType ? { fileType: docFileType } : {}),
                showMenu: true,
                fail: (err: unknown) => {
                  const userDataPath = wxApi.env?.USER_DATA_PATH;
                  const fs =
                    typeof wxApi.getFileSystemManager === "function"
                      ? wxApi.getFileSystemManager()
                      : null;
                  if (
                    allowUserDataRetry &&
                    !isRemoteHttpUrl(localPath) &&
                    typeof userDataPath === "string" &&
                    userDataPath &&
                    fs &&
                    typeof fs.copyFile === "function"
                  ) {
                    const extSuffix = docFileType ? `.${docFileType}` : "";
                    const destPath = `${userDataPath}/cui-preview-${Date.now()}${extSuffix}`;
                    fs.copyFile({
                      srcPath: localPath,
                      destPath,
                      success: () => {
                        openLocalDocument(destPath, false);
                      },
                      fail: () => {
                        console.warn("[file-upload] openDocument failed:", err);
                        wxApi.showToast?.({
                          title: "Preview not supported for this file",
                          icon: "none",
                        });
                      },
                    });
                    return;
                  }
                  console.warn("[file-upload] openDocument failed:", err);
                  wxApi.showToast?.({
                    title: "Preview not supported for this file",
                    icon: "none",
                  });
                },
              });
            };

            if (
              isRemoteHttpUrl(file.path) &&
              typeof wxApi.downloadFile === "function"
            ) {
              wxApi.downloadFile({
                url: file.path,
                success: (res: { tempFilePath?: string }) => {
                  if (res.tempFilePath) {
                    openLocalDocument(res.tempFilePath, false);
                  }
                },
                fail: (err: unknown) => {
                  console.warn("[file-upload] downloadFile failed:", err);
                  wxApi.showToast?.({
                    title: "Failed to load file preview",
                    icon: "none",
                  });
                },
              });
            } else {
              openLocalDocument(file.path, true);
            }
          }
        },

        closePreview: ({ context }) => {
          if (context.get("previewOpen")) {
            context.set("previewOpen", false);
          }
        },

        setPreviewIndex: ({ context, event }) => {
          if (event.type !== "PREVIEW_CHANGE") return;
          const imageCount = context
            .get("files")
            .filter(
              (f) => getFileType(f) === "image" && Boolean(f.path),
            ).length;
          if (imageCount <= 0) {
            context.set("previewIndex", 0);
            context.set("previewOpen", false);
            return;
          }
          const clamped = Math.max(0, Math.min(imageCount - 1, event.index));
          context.set("previewIndex", clamped);
        },

        clickFile: ({ context, event, prop }) => {
          if (event.type !== "FILE_CLICK") return;
          const file = context.get("files")[event.index];
          if (file) {
            prop("onFileClick")?.({ file, index: event.index });
          }
        },

        markImageError: ({ context, event }) => {
          if (event.type !== "IMAGE_ERROR") return;
          const file = context.get("files")[event.index];
          if (!file) return;
          const thumbKey = getFileThumbKey(
            file,
            resolveFileThumb(file, undefined, context.get("resolvedSources")),
          );
          if (!thumbKey) return;
          const failed = context.get("failedThumbs");
          if (!failed.includes(thumbKey)) {
            context.set("failedThumbs", [...failed, thumbKey]);
          }
        },

        clearFiles: ({ context }) => {
          context.set("files", []);
          context.set("failedThumbs", []);
          context.set("previewOpen", false);
          context.set("previewIndex", 0);
        },

        cleanupAudio: () => {
          stopActiveAudio();
        },

        markDisposed: ({ refs }) => {
          refs.set("disposed", true);
          const timer = refs.get("actionSheetTimer");
          if (timer !== undefined) {
            clearTimeout(timer);
            refs.set("actionSheetTimer", undefined);
          }
          refs.get("resolvingPaths").clear();
        },

        setUploading: ({ state, event }) => {
          if (event.type !== "SET_UPLOADING") return;
          if (event.uploading && !state.matches("uploading")) {
            state.set("uploading");
          } else if (!event.uploading && state.matches("uploading")) {
            state.set("idle");
          }
        },

        setupFormField: ({ prop, context, computed, refs, scope }) => {
          setupFormFieldSync(
            {
              component: prop("component"),
              getHost: () => prop("formContext"),
              id: scope.id ?? "file-upload",
              rootId: dom.getRootId(scope),
              getFormId: () => prop("form"),
              getName: () => prop("name"),
              getValue: () => context.get("files"),
              setValue: (value) => {
                context.set("files", Array.isArray(value) ? value : []);
              },
              resetValue: () => {
                context.set("files", prop("defaultValue"));
              },
              getRules: () => prop("rules") ?? [],
              getValidateOn: () => prop("validateOn"),
              isDisabled: () => computed("isDisabled"),
            },
            refs,
          );
        },

        cleanupFormField: ({ refs }) => cleanupFormFieldSync(refs),
      },
    },
  });
