import { createMachine } from "@code-ui/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-ui/form/context";
import { isEqual, isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  FileUploadFile,
  FileUploadMachine,
  FileUploadSchema,
  FileUploadSize,
} from "./file-upload.types";
import { defaultFileUploadProps } from "./file-upload.props";

export const fileUploadMachine: FileUploadMachine =
  createMachine<FileUploadSchema>({
    props: ({ props }) => ({
      ...defaultFileUploadProps,
      ...props,
    }),

    initialState: ({ prop }) => (prop("uploading") ? "uploading" : "idle"),

    refs: ({ prop }) => ({
      initialFiles: prop("value") ?? prop("defaultValue") ?? [],
      formField: undefined,
    }),

    context: ({ prop, bindable, getRefs }) => ({
      files: bindable<FileUploadFile[]>(() => {
        const controlledVal = prop("value");
        const defaultVal = prop("defaultValue");

        return {
          value: isNotNull(controlledVal) ? controlledVal : undefined,
          defaultValue: controlledVal ?? defaultVal ?? [],
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
        Boolean(prop("interactive") ?? true),
      isMaxFiles: ({ context, prop }) => {
        const max = prop("maxFiles") ?? 10;
        return context.get("files").length >= max;
      },
      hasFiles: ({ context }) => context.get("files").length > 0,
      fileCount: ({ context }) => context.get("files").length,
      isUploading: ({ prop, state }) =>
        Boolean(prop("uploading")) || state.matches("uploading"),
      effectiveSize: ({ prop, computed }) =>
        (computed("fieldSize") || prop("size") || "md") as FileUploadSize,
    },

    watch: ({ prop, state }) => {
      const uploading = Boolean(prop("uploading"));
      if (uploading && !state.matches("uploading")) {
        state.set("uploading");
      } else if (!uploading && state.matches("uploading")) {
        state.set("idle");
      }
    },

    entry: ["setupFormField"],
    exit: ["cleanupFormField"],

    on: {
      SET_VALUE: {
        actions: ["setValue"],
      },
      ADD_FILES: {
        guard: "canAddFiles",
        actions: ["addFiles"],
      },
      REMOVE_FILE: {
        guard: "isInteractive",
        actions: ["removeFile"],
      },
      CLEAR_FILES: {
        guard: "isInteractive",
        actions: ["clearFiles"],
      },
      SET_UPLOADING: {
        actions: ["setUploading"],
      },
    },

    states: {
      idle: {
        tags: ["idle"],
        on: {
          CHOOSE: {
            guard: "canChoose",
            target: "choosing",
          },
        },
      },
      choosing: {
        tags: ["busy"],
        on: {
          CHOOSE_COMPLETE: {
            target: "idle",
          },
        },
      },
      uploading: {
        tags: ["busy"],
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
      actions: {
        setValue: ({ context, event }) => {
          if (event.type !== "SET_VALUE") return;
          context.set("files", event.value);
        },
        addFiles: ({ context, event, prop }) => {
          if (event.type !== "ADD_FILES") return;
          const maxFiles = prop("maxFiles") ?? 10;
          const multiple = Boolean(prop("multiple") ?? true);
          const current = context.get("files");

          if (!multiple) {
            const next = event.files.slice(0, 1);
            context.set("files", next);
            return;
          }

          const remainingSlots = Math.max(0, maxFiles - current.length);
          if (remainingSlots <= 0) return;

          const toAdd = event.files.slice(0, remainingSlots);
          context.set("files", [...current, ...toAdd]);
        },
        removeFile: ({ context, event, prop }) => {
          if (event.type !== "REMOVE_FILE") return;
          const current = context.get("files");
          const index = event.index;
          if (index < 0 || index >= current.length) return;

          const removed = current[index];
          const next = current.filter((_, i) => i !== index);
          context.set("files", next);

          if (removed) {
            prop("onRemove")?.({ file: removed, index });
          }
        },
        clearFiles: ({ context }) => {
          context.set("files", []);
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
              getFormId: () => prop("form") || "",
              getName: () => prop("name") || "",
              getValue: () => context.get("files"),
              setValue: (value) => {
                context.set("files", Array.isArray(value) ? value : []);
              },
              resetValue: () => {
                context.set("files", prop("defaultValue") ?? []);
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

