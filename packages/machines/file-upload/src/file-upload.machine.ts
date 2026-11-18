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
import {
  cleanExtensions,
  getFileThumbKey,
  getFileType,
  hasDocumentExtension,
  isAudioFile,
  isImageFile,
  isVideoFile,
  resolveFileThumb,
  validateFiles,
} from "./file-upload.utils";

const getWx = (): any => (globalThis as Record<string, unknown>).wx;

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

    watch: ({ prop, state, track }) => {
      track([() => prop("uploading")], () => {
        const uploading = prop("uploading");
        if (uploading && !state.matches("uploading")) {
          state.set("uploading");
        } else if (!uploading && state.matches("uploading")) {
          state.set("idle");
        }
      });
    },

    entry: ["setupFormField"],
    exit: ["cleanupFormField", "cleanupAudio", "flushChooseCallback"],

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
      SET_UPLOADING: {
        actions: ["setUploading"],
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
        },
      },
      uploading: {
        tags: ["busy"],
        on: {
          CHOOSE: {
            actions: ["resolveChooseFromEvent"],
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
      },

      effects: {
        pickWeChatFiles: ({ prop, context, send }) => {
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

          if (mode === "messageFile" || (mode === "auto" && hasDoc)) {
            if (typeof wxApi.chooseMessageFile === "function") {
              const cleanExts = cleanExtensions(accept);
              wxApi.chooseMessageFile({
                count: remainingSlots,
                type: cleanExts.length > 0 ? "file" : "all",
                extension: cleanExts.length > 0 ? cleanExts : undefined,
                success: (res: { tempFiles?: unknown[] }) => {
                  send({ type: "PICKED_RAW", files: res.tempFiles ?? [] });
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
              mediaType: prop("mediaType"),
              sourceType: prop("sourceType"),
              maxDuration: prop("maxDuration"),
              sizeType: prop("sizeType"),
              camera: prop("camera"),
              success: (res: { tempFiles?: unknown[] }) => {
                send({ type: "PICKED_RAW", files: res.tempFiles ?? [] });
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
              success: (res: { tempFiles?: unknown[] }) => {
                send({ type: "PICKED_RAW", files: res.tempFiles ?? [] });
              },
              fail: () => {},
              complete: () => {
                send({ type: "CHOOSE_COMPLETE" });
              },
            });
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
          context.set("files", event.value);
          context.set("failedThumbs", []);
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
            const removedKey = getFileThumbKey(
              removed,
              resolveFileThumb(removed),
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
                fail: (err: unknown) => {
                  console.warn("[file-upload] previewMedia failed:", err);
                },
              });
            }
          } else if (fileType === "audio") {
            playAudio(file, wxApi);
          } else if (typeof wxApi.openDocument === "function") {
            wxApi.openDocument({
              filePath: file.path,
              showMenu: true,
              fail: (err: unknown) => {
                console.warn("[file-upload] openDocument failed:", err);
              },
            });
          }
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
          const thumbKey = getFileThumbKey(file, resolveFileThumb(file));
          if (!thumbKey) return;
          const failed = context.get("failedThumbs");
          if (!failed.includes(thumbKey)) {
            context.set("failedThumbs", [...failed, thumbKey]);
          }
        },

        clearFiles: ({ context }) => {
          context.set("files", []);
          context.set("failedThumbs", []);
        },

        cleanupAudio: () => {
          stopActiveAudio();
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

