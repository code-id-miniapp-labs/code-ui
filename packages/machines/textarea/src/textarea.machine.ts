import { createMachine } from "@code-ui/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-ui/form/context";
import { isEmpty, isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  TextareaMachine,
  TextareaSchema,
  TextareaSize,
} from "./textarea.types";
import { defaultTextareaProps } from "./textarea.props";

const toStringValue = (val: unknown): string | undefined =>
  isNotNull(val) ? String(val) : undefined;

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
    characterCount: ({ context }) => (context.get("value") ?? "").length,
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
    effectiveSize: ({ prop, computed }) => {
      const rawSize = prop("size");
      const fieldSize = computed("fieldSize");
      return rawSize && rawSize !== "md"
        ? rawSize
        : ((fieldSize || rawSize || "md") as TextareaSize);
    },
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
            getFormId: () => prop("form") || "",
            getName: () => prop("name") || "",
            getValue: () => context.get("value"),
            setValue: (rawVal: unknown) => {
              context.set("value", toStringValue(rawVal) ?? "");
            },
            resetValue: () => {
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
        cleanupFormFieldSync(refs);
      },

      handleFocus: ({ context, prop, refs }) => {
        const val = context.get("value");
        prop("onFocus")?.({ value: val });
        refs.get("formField")?.emitFocus(val);
      },

      handleBlur: ({ context, prop, refs }) => {
        const val = context.get("value");
        prop("onBlur")?.({ value: val });
        refs.get("formField")?.emitBlur(val);
      },

      handleConfirm: ({ context, prop }) => {
        prop("onConfirm")?.({ value: context.get("value") });
      },

      handleLineChange: ({ prop, event }) => {
        prop("onLineChange")?.((event as any).details);
      },

      setValue: ({ context, event }) => {
        context.set("value", toStringValue((event as any).value) ?? "");
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
