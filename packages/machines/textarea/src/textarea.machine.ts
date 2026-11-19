import { createMachine } from "@code-id-labs/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-id-labs/form/context";
import { isEmpty, isNotEmpty, isNotNull } from "@code-id-labs/utils";
import type {
  TextareaLineChangeDetails,
  TextareaMachine,
  TextareaSchema,
} from "./textarea.types";
import { defaultTextareaProps } from "./textarea.props";
import * as dom from "./textarea.dom";

const toStringValue = (val: unknown): string | undefined =>
  isNotNull(val) ? String(val) : undefined;

declare const wx: Record<string, any> | undefined;

function getWx(): Record<string, any> | undefined {
  if (typeof wx !== "undefined" && wx) return wx;
  return (globalThis as Record<string, any>).wx;
}

function scheduleNextTick(cb: () => void): () => void {
  let cancelled = false;
  const run = () => {
    if (!cancelled) cb();
  };
  const wxApi = getWx();
  if (wxApi && typeof wxApi.nextTick === "function") {
    wxApi.nextTick(run);
  } else {
    queueMicrotask(run);
  }
  return () => {
    cancelled = true;
  };
}

export const textareaMachine: TextareaMachine = createMachine<TextareaSchema>({
  props: ({ props }) => ({
    ...defaultTextareaProps,
    ...props,
  }),

  initialState: ({ prop }) => (prop("autoFocus") ? "focused" : "idle"),

  refs: ({ prop }) => ({
    initialValue:
      toStringValue(prop("value")) ?? toStringValue(prop("defaultValue")) ?? "",
    formField: undefined,
    cancelRefocus: undefined,
  }),

  context: ({ prop, bindable, getRefs }) => ({
    value: bindable<string>(() => {
      const controlledVal = toStringValue(prop("value"));
      const defaultVal = toStringValue(prop("defaultValue"));

      return {
        value: controlledVal,
        defaultValue: controlledVal ?? defaultVal ?? "",
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
    ...createFormFieldComputed("textarea"),
    isInvalid: ({ prop, refs, context, scope }) =>
      Boolean(
        context.get("invalid") ||
          hasFormFieldErrors(prop, refs, scope, "textarea"),
      ),
    isEmpty: ({ context }) => isEmpty(context.get("value")),
    isFilled: ({ context }) => !isEmpty(context.get("value")),
    characterCount: ({ context }) => context.get("value").length,
    isDisabled: ({ prop, computed }) =>
      Boolean(
        prop("disabled") ||
          computed("formDisabled") ||
          computed("fieldDisabled"),
      ),
    isReadOnly: ({ prop, computed }) =>
      Boolean(prop("readOnly") || computed("formReadOnly")),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),
    isClearable: ({ prop, computed }) =>
      Boolean(
        prop("clearable") && computed("isInteractive") && computed("isFilled"),
      ),
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  on: {
    "TEXTAREA.CHANGE": {
      guard: "isInteractive",
      actions: ["setValue"],
    },
    "TEXTAREA.CONFIRM": {
      actions: ["handleConfirm"],
    },
    "TEXTAREA.LINE_CHANGE": {
      actions: ["handleLineChange"],
    },
    "TEXTAREA.CLEAR": {
      guard: "isInteractive",
      actions: ["clearValue"],
    },
    SET_VALUE: {
      actions: ["setValue"],
    },
    CLEAR_VALUE: {
      actions: ["clearValue"],
    },
    RESET_VALUE: {
      target: "idle",
      actions: ["resetValue"],
    },
  },

  states: {
    idle: {
      tags: ["idle"],
      on: {
        "TEXTAREA.FOCUS": {
          guard: "isInteractive",
          target: "focused",
          actions: ["handleFocus"],
        },
      },
    },

    focused: {
      tags: ["focused"],
      on: {
        "TEXTAREA.BLUR": {
          target: "idle",
          actions: ["handleBlur"],
        },
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
    },

    actions: {
      setupFormField: ({ context, prop, refs, scope, state, computed }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            getHost: () => prop("formContext"),
            id: scope.id ?? "textarea",
            rootId: dom.getRootId(scope),
            getFormId: () => prop("form") || "",
            getName: () => prop("name"),
            getValue: () => context.get("value"),
            setValue: (rawVal: unknown) => {
              context.set("value", toStringValue(rawVal) ?? "");
            },
            resetValue: () => {
              refs.get("cancelRefocus")?.();
              refs.set("cancelRefocus", undefined);
              const initial =
                refs.get("initialValue") ??
                toStringValue(prop("defaultValue")) ??
                "";
              context.set("value", initial);
              context.set("invalid", false);
              state.set("idle");
            },
            focus: () => {
              if (!computed("isInteractive")) return;
              refs.get("cancelRefocus")?.();
              refs.set("cancelRefocus", undefined);
              if (state.matches("focused")) {
                state.set("idle");
                refs.set(
                  "cancelRefocus",
                  scheduleNextTick(() => {
                    refs.set("cancelRefocus", undefined);
                    if (computed("isInteractive")) {
                      state.set("focused");
                    }
                  }),
                );
                return;
              }
              state.set("focused");
            },
            getRules: () => prop("rules") ?? [],
            getValidateOn: () => prop("validateOn"),
            isDisabled: () => computed("isDisabled"),
          },
          refs,
        );
      },

      cleanupFormField: ({ refs }) => {
        refs.get("cancelRefocus")?.();
        refs.set("cancelRefocus", undefined);
        cleanupFormFieldSync(refs);
      },

      handleFocus: ({ context, prop, refs }) => {
        const val = context.get("value");
        prop("onFocus")?.({ value: val });
        refs.get("formField")?.emitFocus(val);
      },

      handleBlur: ({ context, prop, refs }) => {
        refs.get("cancelRefocus")?.();
        refs.set("cancelRefocus", undefined);
        const val = context.get("value");
        prop("onBlur")?.({ value: val });
        refs.get("formField")?.emitBlur(val);
      },

      handleConfirm: ({ context, prop }) => {
        prop("onConfirm")?.({ value: context.get("value") });
      },

      handleLineChange: ({ context, prop, event }) => {
        if (event.type !== "TEXTAREA.LINE_CHANGE") return;
        const raw = event.detail;
        const height = typeof raw.height === "number" ? raw.height : 0;
        const lineHeight =
          typeof raw.lineHeight === "number" ? raw.lineHeight : 0;
        const val = context.get("value");
        let lineCount = typeof raw.lineCount === "number" ? raw.lineCount : 1;
        if (!val || val.length === 0) {
          lineCount = 1;
        } else if (lineHeight > 0 && height > 0) {
          lineCount = Math.max(1, Math.round(height / lineHeight));
        }

        const details: TextareaLineChangeDetails = {
          ...raw,
          height,
          lineHeight,
          lineCount,
        };
        prop("onLineChange")?.(details);
      },

      setValue: ({ context, event }) => {
        if (event.type !== "TEXTAREA.CHANGE" && event.type !== "SET_VALUE")
          return;
        context.set("value", toStringValue(event.value) ?? "");
      },

      clearValue: ({ context, prop }) => {
        context.set("value", "");
        prop("onClear")?.({});
      },

      resetValue: ({ context, prop, refs }) => {
        const initial =
          refs.get("initialValue") ?? toStringValue(prop("defaultValue")) ?? "";
        context.set("value", initial);
        context.set("invalid", false);
      },
    },
  },
});
