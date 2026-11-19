import { createMachine } from "@code-id-labs/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-id-labs/form/context";
import { isEmpty, isEqual, isNotEmpty } from "@code-id-labs/utils";
import type {
  PinInputMachine,
  PinInputParams,
  PinInputSchema,
  PinInputType,
} from "./pin-input.types";
import { defaultPinInputProps } from "./pin-input.props";
import * as dom from "./pin-input.dom";

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

export function isValidCharacter(char: string, type: PinInputType): boolean {
  if (type === "numeric") return /^[0-9]$/.test(char);
  if (type === "alphabetic") return /^[a-zA-Z]$/.test(char);
  return /^[a-zA-Z0-9]$/.test(char);
}

function normalizePinValue(raw: unknown, length: number): string[] {
  const chars = Array.isArray(raw) ? raw.map(String) : String(raw ?? "").split("");
  const nextValues = Array(length).fill("");
  for (let i = 0; i < length; i++) {
    nextValues[i] = chars[i] ?? "";
  }
  return nextValues;
}

function stripZeroWidth(raw: unknown): string {
  return (typeof raw === "string" ? raw : "").replace(/\u200B/g, "");
}

function resolveReplacementChar(
  cleanVal: string,
  currentVal: string,
  index: number,
  length: number,
): string | null {
  if (
    !currentVal ||
    !cleanVal.includes(currentVal) ||
    (cleanVal.length !== 2 && index !== length - 1)
  ) {
    return null;
  }
  return cleanVal.replace(currentVal, "").slice(-1) || cleanVal.slice(-1);
}

export function resolvePinInputCellReturnValue(
  value: string[],
  index: number,
  rawVal: unknown,
  length: number,
  type: PinInputType,
): string {
  const cleanVal = stripZeroWidth(rawVal);
  if (cleanVal === "") return "";

  const currentVal = value[index] ?? "";
  if (cleanVal.length === 1) {
    return isValidCharacter(cleanVal, type) ? cleanVal : currentVal;
  }

  const replacement = resolveReplacementChar(cleanVal, currentVal, index, length);
  if (replacement !== null) {
    return isValidCharacter(replacement, type) ? replacement : currentVal;
  }

  return (
    cleanVal.split("").find((c) => isValidCharacter(c, type)) ?? currentVal
  );
}

function advanceFocusOrBlur(
  {
    context,
    computed,
    prop,
    refs,
  }: Pick<PinInputParams, "context" | "computed" | "prop" | "refs">,
  nextIndex: number,
  length: number,
): void {
  if (computed("isValueComplete") && prop("blurOnComplete")) {
    context.set("focusedIndex", -1);
    refs.get("formField")?.emitBlur(computed("valueAsString"));
  } else {
    context.set("focusedIndex", Math.min(length - 1, nextIndex));
  }
}

export const pinInputMachine: PinInputMachine = createMachine<PinInputSchema>({
  props: ({ props }) => ({
    ...defaultPinInputProps,
    ...props,
  }),

  initialState: ({ prop }) => (prop("autoFocus") ? "focused" : "idle"),

  refs: ({ prop }) => {
    const len = prop("length");
    const raw = prop("value") ?? prop("defaultValue");
    return {
      initialValue:
        raw !== undefined && raw !== null
          ? normalizePinValue(raw, len)
          : Array(len).fill(""),
      formField: undefined,
      cancelRefocus: undefined,
    };
  },

  context: ({ prop, bindable, getRefs }) => ({
    length: bindable<number>(() => ({
      value: prop("length"),
      defaultValue: 4,
    })),

    value: bindable<string[]>(() => {
      const len = prop("length");
      const rawVal = prop("value");
      const isControlled = rawVal !== undefined && rawVal !== null;
      const controlledVal = isControlled
        ? normalizePinValue(rawVal, len)
        : undefined;

      const rawDefault = prop("defaultValue");
      const initial = isControlled
        ? (controlledVal as string[])
        : rawDefault !== undefined && rawDefault !== null
          ? normalizePinValue(rawDefault, len)
          : Array(len).fill("");

      return {
        value: controlledVal,
        defaultValue: initial,
        isEqual,
        onChange: (nextVal) => {
          const valueAsString = nextVal.join("");
          prop("onChange")?.({
            value: nextVal,
            valueAsString,
          });

          const formField = getRefs().get("formField");
          if (formField) {
            formField.emitInput(valueAsString);
            formField.emitChange(valueAsString);
          }

          if (
            nextVal.length === prop("length") &&
            nextVal.every((c) => Boolean(c && c.trim() !== ""))
          ) {
            prop("onComplete")?.({
              value: nextVal,
              valueAsString,
            });
          }
        },
      };
    }),

    focusedIndex: bindable<number>(() => ({
      defaultValue: prop("autoFocus") ? 0 : -1,
    })),

    invalid: bindable<boolean>(() => {
      const rawInvalid = prop("invalid");
      return {
        value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
        defaultValue: false,
      };
    }),
  }),

  computed: {
    ...createFormFieldComputed("pin-input"),
    isInvalid: ({ prop, refs, context, scope }) =>
      Boolean(
        context.get("invalid") ||
          hasFormFieldErrors(prop, refs, scope, "pin-input"),
      ),
    valueAsString: ({ context }) => context.get("value").join(""),
    isValueComplete: ({ context }) => {
      const val = context.get("value");
      return val.length === context.get("length") && val.every((c) => !isEmpty(c));
    },
    isEmpty: ({ context }) => isEmpty(context.get("value")),
    isFilled: ({ context }) => !isEmpty(context.get("value")),
    isReadOnly: ({ prop, computed }) =>
      Boolean(computed("formReadOnly") || prop("readOnly")),
    isDisabled: ({ prop, computed }) =>
      Boolean(
        computed("formDisabled") ||
          computed("fieldDisabled") ||
          prop("disabled"),
      ),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  on: {
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
        "INPUT.FOCUS": {
          guard: "isInteractive",
          target: "focused",
          actions: ["setFocusedIndex"],
        },
        "INPUT.CHANGE": {
          guard: "isInteractive",
          target: "focused",
          actions: ["handleInputChange"],
        },
        "INPUT.BLUR": {
          actions: ["resetFocusedIndex"],
        },
      },
    },

    focused: {
      tags: ["focused"],
      on: {
        "INPUT.FOCUS": {
          guard: "isInteractive",
          actions: ["setFocusedIndex"],
        },
        "INPUT.CHANGE": {
          guard: "isInteractive",
          actions: ["handleInputChange"],
        },
        "INPUT.BLUR": [
          {
            guard: "isBlurringActiveCell",
            target: "idle",
            actions: ["resetFocusedIndex"],
          },
        ],
        "INPUT.CLEAR": {
          guard: "isInteractive",
          actions: ["clearValue"],
        },
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
      isBlurringActiveCell: ({ context, event }) => {
        const currentFocused = context.get("focusedIndex");
        const blurredIdx = event.type === "INPUT.BLUR" ? event.index : undefined;
        return !(
          typeof blurredIdx === "number" &&
          blurredIdx !== -1 &&
          currentFocused !== -1 &&
          blurredIdx !== currentFocused
        );
      },
    },

    actions: {
      setupFormField: ({ context, prop, computed, refs, scope, state }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            getHost: () => prop("formContext"),
            id: scope.id ?? "pin-input",
            rootId: dom.getRootId(scope),
            getFormId: () => prop("form") || "",
            getName: () => prop("name"),
            getValue: () => computed("valueAsString"),
            setValue: (rawVal: unknown) => {
              context.set(
                "value",
                normalizePinValue(rawVal, context.get("length")),
              );
            },
            resetValue: () => {
              refs.get("cancelRefocus")?.();
              refs.set("cancelRefocus", undefined);
              const len = context.get("length");
              const initial =
                refs.get("initialValue") ??
                prop("defaultValue") ??
                Array(len).fill("");
              context.set("value", normalizePinValue(initial, len));
              context.set("focusedIndex", -1);
              context.set("invalid", false);
              state.set("idle");
            },
            focus: () => {
              if (!computed("isInteractive")) return;
              refs.get("cancelRefocus")?.();
              refs.set("cancelRefocus", undefined);
              const firstEmptyIndex = context.get("value").findIndex(isEmpty);
              const targetIdx = firstEmptyIndex !== -1 ? firstEmptyIndex : 0;
              if (
                state.matches("focused") &&
                context.get("focusedIndex") === targetIdx
              ) {
                state.set("idle");
                context.set("focusedIndex", -1);
                refs.set(
                  "cancelRefocus",
                  scheduleNextTick(() => {
                    refs.set("cancelRefocus", undefined);
                    if (computed("isInteractive")) {
                      state.set("focused");
                      context.set("focusedIndex", targetIdx);
                    }
                  }),
                );
                return;
              }
              state.set("focused");
              context.set("focusedIndex", targetIdx);
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

      setFocusedIndex: ({
        context,
        event,
        flush,
        state,
        refs,
        computed,
        prop,
      }) => {
        const len = context.get("length");
        const idx = event.type === "INPUT.FOCUS" ? event.index : 0;
        const force = event.type === "INPUT.FOCUS" && Boolean(event.force);
        const currentValues = context.get("value");
        const firstEmptyIndex = currentValues.findIndex(isEmpty);
        const targetIndex =
          firstEmptyIndex !== -1
            ? firstEmptyIndex
            : Math.max(0, Math.min(len - 1, idx));

        if (idx !== targetIndex || force) {
          context.set("focusedIndex", -1);
          flush(() => {
            state.set("focused");
            context.set("focusedIndex", targetIndex);
          });
        } else {
          context.set("focusedIndex", targetIndex);
        }

        const valueAsString = computed("valueAsString");
        refs.get("formField")?.emitFocus(valueAsString);
        prop("onFocus")?.({
          value: currentValues,
          valueAsString,
          index: targetIndex,
        });
      },

      resetFocusedIndex: ({ context, refs, computed, prop }) => {
        context.set("focusedIndex", -1);
        const valueAsString = computed("valueAsString");
        refs.get("formField")?.emitBlur(valueAsString);
        prop("onBlur")?.({
          value: context.get("value"),
          valueAsString,
        });
      },

      handleInputChange: ({ context, prop, computed, event, refs }) => {
        if (event.type !== "INPUT.CHANGE") return;

        const { index, value: rawVal } = event;
        const length = context.get("length");
        const inputType = prop("type");
        const currentValues = [...context.get("value")];

        while (currentValues.length < length) {
          currentValues.push("");
        }

        const cleanVal = stripZeroWidth(rawVal);

        if (cleanVal === "") {
          if (currentValues[index] !== "") {
            currentValues[index] = "";
            context.set("value", currentValues);
            context.set(
              "focusedIndex",
              index === length - 1 ? index : Math.max(0, index - 1),
            );
            return;
          }

          const prevIndex = Math.max(0, index - 1);
          currentValues[prevIndex] = "";
          context.set("value", currentValues);
          context.set("focusedIndex", prevIndex);
          return;
        }

        if (cleanVal.length > 1) {
          const curChar = currentValues[index] ?? "";
          const replacement = resolveReplacementChar(
            cleanVal,
            curChar,
            index,
            length,
          );
          if (replacement !== null && isValidCharacter(replacement, inputType)) {
            currentValues[index] = replacement;
            context.set("value", currentValues);
            advanceFocusOrBlur(
              { context, computed, prop, refs },
              index + 1,
              length,
            );
            return;
          }

          const validChars = cleanVal
            .split("")
            .filter((c: string) => isValidCharacter(c, inputType));

          if (validChars.length === 0) {
            prop("onInvalid")?.({ value: cleanVal, index });
            return;
          }

          let writeIdx = index;
          for (const char of validChars) {
            if (writeIdx < length) {
              currentValues[writeIdx] = char;
              writeIdx++;
            }
          }

          context.set("value", currentValues);
          advanceFocusOrBlur({ context, computed, prop, refs }, writeIdx, length);
          return;
        }

        if (!isValidCharacter(cleanVal, inputType)) {
          prop("onInvalid")?.({ value: cleanVal, index });
          return;
        }

        currentValues[index] = cleanVal;
        context.set("value", currentValues);
        advanceFocusOrBlur({ context, computed, prop, refs }, index + 1, length);
      },

      setValue: ({ context, event }) => {
        if (event.type !== "SET_VALUE") return;
        context.set(
          "value",
          normalizePinValue(event.value, context.get("length")),
        );
      },

      clearValue: ({ context }) => {
        context.set("value", Array(context.get("length")).fill(""));
        context.set("focusedIndex", 0);
      },

      resetValue: ({ context, refs, prop }) => {
        const length = context.get("length");
        const initial =
          refs.get("initialValue") ??
          prop("defaultValue") ??
          Array(length).fill("");
        context.set("value", normalizePinValue(initial, length));
        context.set("focusedIndex", -1);
        context.set("invalid", false);
      },
    },
  },
});
