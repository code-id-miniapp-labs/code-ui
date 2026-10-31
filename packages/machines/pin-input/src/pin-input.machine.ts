import { createMachine } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
import { isEmpty, isNotEmpty } from "@code-ui/utils";
import type {
  PinInputContext,
  PinInputMachine,
  PinInputParams,
  PinInputProps,
  PinInputSchema,
  PinInputType,
} from "./pin-input.types";
import { defaultPinInputProps } from "./pin-input.props";

export function isValidCharacter(char: string, type: PinInputType): boolean {
  if (type === "numeric") {
    return /^[0-9]$/.test(char);
  }
  if (type === "alphabetic") {
    return /^[a-zA-Z]$/.test(char);
  }
  return /^[a-zA-Z0-9]$/.test(char);
}

function normalizePinValue(raw: string[] | string, length: number): string[] {
  const chars = Array.isArray(raw) ? raw : String(raw ?? "").split("");
  const nextValues = Array(length).fill("");
  for (let i = 0; i < length; i++) {
    nextValues[i] = chars[i] ?? "";
  }
  return nextValues;
}

function advanceFocusOrBlur(
  {
    context,
    computed,
    refs,
  }: Pick<PinInputParams, "context" | "computed" | "refs">,
  nextIndex: number,
  length: number,
): void {
  if (computed("isValueComplete") && context.get("blurOnComplete")) {
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
    const len = prop("length") ?? 4;
    const raw = prop("value") ?? prop("defaultValue");
    const initial =
      raw !== undefined && raw !== null
        ? normalizePinValue(raw, len)
        : Array(len).fill("");
    return {
      initialValue: [...initial],
      currentFormBus: prop("formBus"),
      formField: undefined,
    };
  },

  context: ({ prop, bindable, getRefs }) => {
    const propBindable = <
      K extends keyof PinInputContext & keyof PinInputProps,
    >(
      key: K,
      defaultValue: PinInputContext[K],
    ) =>
      bindable<PinInputContext[K]>(() => ({
        value: prop(key) as PinInputContext[K] | undefined,
        defaultValue,
      }));

    const stateBindable = <K extends keyof PinInputContext>(
      _key: K,
      defaultValue: PinInputContext[K],
    ) =>
      bindable<PinInputContext[K]>(() => ({
        defaultValue,
      }));

    return {
      length: propBindable("length", 4),

      value: bindable<string[]>(() => {
        const len = prop("length") ?? 4;
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
          isEqual: (prev, next) => {
            if (prev === next) return true;
            if (!Array.isArray(prev) || !Array.isArray(next)) return false;
            if (prev.length !== next.length) return false;
            for (let i = 0; i < prev.length; i++) {
              if (prev[i] !== next[i]) return false;
            }
            return true;
          },
          onChange: (nextVal) => {
            const valueAsString = nextVal.join("");
            prop("onValueChange")?.({ value: nextVal, valueAsString });
            prop("component")?.triggerEvent?.("change", {
              value: nextVal,
              valueAsString,
            });
            prop("component")?.setData?.({ value: nextVal });

            const formField = getRefs().get("formField");
            if (formField) {
              formField.emitInput(valueAsString);
              formField.emitChange(valueAsString);
            }

            const isComplete =
              nextVal.length === (prop("length") ?? 4) &&
              nextVal.every((c) => Boolean(c && c.trim() !== ""));
            if (isComplete) {
              prop("onValueComplete")?.({ value: nextVal, valueAsString });
              prop("component")?.triggerEvent?.("complete", {
                value: nextVal,
                valueAsString,
              });
            }
          },
        };
      }),

      focusedIndex: stateBindable("focusedIndex", prop("autoFocus") ? 0 : -1),

      variant: propBindable("variant", "outline"),
      color: propBindable("color", "primary"),
      size: propBindable("size", "md"),
      highlight: propBindable("highlight", false),
      disabled: propBindable("disabled", false),
      readOnly: propBindable("readOnly", false),
      formDisabled: stateBindable("formDisabled", false),
      formReadOnly: stateBindable("formReadOnly", false),
      fieldDisabled: propBindable("fieldDisabled", false),
      fieldSize: propBindable("fieldSize", ""),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      mask: propBindable("mask", false),
      otp: propBindable("otp", true),
      type: propBindable("type", "numeric"),
      placeholder: propBindable("placeholder", ""),
      separator: propBindable("separator", false),
      separatorChar: propBindable("separatorChar", "-"),
      blurOnComplete: propBindable("blurOnComplete", false),
      selectOnFocus: propBindable("selectOnFocus", false),
      form: propBindable("form", ""),
      name: propBindable("name", ""),
      ui: propBindable("ui", {}),
    };
  },

  computed: {
    valueAsString: ({ context }) => context.get("value").join(""),
    isValueComplete: ({ context }) => {
      const val = context.get("value");
      const len = context.get("length");
      return val.length === len && val.every((char) => !isEmpty(char));
    },
    isEmpty: ({ context }) => isEmpty(context.get("value")),
    isFilled: ({ context }) => !isEmpty(context.get("value")),
    isReadOnly: ({ context }) =>
      context.get("formReadOnly") || context.get("readOnly"),
    isDisabled: ({ context }) =>
      context.get("formDisabled") ||
      context.get("fieldDisabled") ||
      context.get("disabled"),
    effectiveSize: ({ context }) =>
      context.get("size") || context.get("fieldSize") || "md",

    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),
  },

  watch: ({ prop, refs }) => {
    const nextFormBus = prop("formBus");
    if (nextFormBus !== refs.get("currentFormBus")) {
      refs.set("currentFormBus", nextFormBus);
      refs.get("formField")?.rebind(nextFormBus ?? null);
    }
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
          target: "focused",
          actions: ["setFocusedIndex"],
        },
        "INPUT.CHANGE": {
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
          actions: ["setFocusedIndex"],
        },
        "INPUT.CHANGE": {
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
          actions: ["clearValue"],
        },
      },
    },
  },

  implementations: {
    guards: {
      isBlurringActiveCell: ({ context, event }) => {
        const currentFocused = context.get("focusedIndex");
        const blurredIdx = (event as any)?.index;
        if (
          typeof blurredIdx === "number" &&
          blurredIdx !== -1 &&
          currentFocused !== -1 &&
          blurredIdx !== currentFocused
        ) {
          return false;
        }
        return true;
      },
    },

    actions: {
      setupFormField: ({ context, prop, computed, refs, scope, state }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            bus: prop("formBus"),
            id: scope.id ?? "pin-input",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () => context.get("name") || prop("name") || "",
            getValue: () => computed("valueAsString"),
            setValue: (rawVal: any) => {
              const len = context.get("length");
              context.set("value", normalizePinValue(rawVal, len));
            },
            resetValue: () => {
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
              if (
                context.get("disabled") ||
                context.get("formDisabled") ||
                context.get("fieldDisabled") ||
                context.get("readOnly") ||
                context.get("formReadOnly")
              ) {
                return;
              }
              const currentValues = context.get("value");
              const firstEmptyIndex = currentValues.findIndex(isEmpty);
              const targetIdx = firstEmptyIndex !== -1 ? firstEmptyIndex : 0;
              state.set("focused");
              context.set("focusedIndex", targetIdx);
            },
            getValidateOn: () => prop("validateOn"),
            isDisabled: () => computed("isDisabled"),
            onValidationChange: (isValid) => {
              context.set("invalid", !isValid);
            },
            onStateChange: (s) => {
              if (s.fieldDisabled !== undefined) {
                context.set("fieldDisabled", Boolean(s.fieldDisabled));
              }
              if (s.fieldSize !== undefined) {
                context.set("fieldSize", s.fieldSize);
              }
              if (s.formDisabled !== undefined) {
                context.set("formDisabled", Boolean(s.formDisabled));
              }
              if (s.formReadOnly !== undefined) {
                context.set("formReadOnly", Boolean(s.formReadOnly));
              }
            },
          },
          refs,
        );
      },

      cleanupFormField: ({ refs }) => {
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
        if (!computed("isInteractive")) {
          return;
        }
        const len = context.get("length");
        const idx =
          typeof (event as any).index === "number" ? (event as any).index : 0;
        const currentValues = context.get("value");
        const firstEmptyIndex = currentValues.findIndex(isEmpty);
        const targetIndex =
          firstEmptyIndex !== -1
            ? firstEmptyIndex
            : Math.max(0, Math.min(len - 1, idx));

        const force = Boolean((event as any)?.force);
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

        const formField = refs.get("formField");

        if (formField) {
          formField.emitFocus(valueAsString);
        }

        prop("component")?.triggerEvent?.("focus", {
          value: currentValues,
          valueAsString,
          index: targetIndex,
        });
      },

      resetFocusedIndex: ({ context, refs, computed, prop }) => {
        context.set("focusedIndex", -1);
        const valueAsString = computed("valueAsString");
        const formField = refs.get("formField");

        if (formField) {
          formField.emitBlur(valueAsString);
        }
        prop("component")?.triggerEvent?.("blur", {
          value: context.get("value"),
          valueAsString,
        });
      },

      handleInputChange: ({ context, prop, computed, event, refs }) => {
        if (!computed("isInteractive")) {
          return;
        }

        const { index, value: rawVal } = event as any;
        const length = context.get("length");
        const inputType = context.get("type");
        const currentValues = [...context.get("value")];

        // Ensure array is of correct length
        while (currentValues.length < length) {
          currentValues.push("");
        }

        // Clean out zero-width spaces (\u200B)
        const cleanVal = (typeof rawVal === "string" ? rawVal : "").replace(
          /\u200B/g,
          "",
        );

        // Case 1: Deletion / Backspace (cleanVal is empty)
        if (cleanVal === "") {
          if (currentValues[index] !== "") {
            currentValues[index] = "";
            context.set("value", currentValues);
            if (index === length - 1) {
              context.set("focusedIndex", index);
              return;
            }
            const prevIndex = Math.max(0, index - 1);
            context.set("focusedIndex", prevIndex);
            return;
          }

          const prevIndex = Math.max(0, index - 1);
          currentValues[prevIndex] = "";
          context.set("value", currentValues);
          context.set("focusedIndex", prevIndex);
          return;
        }

        if (cleanVal.length > 1) {
          if (
            currentValues[index] &&
            cleanVal.includes(currentValues[index]) &&
            (cleanVal.length === 2 || index === length - 1)
          ) {
            const newChar =
              cleanVal.replace(currentValues[index], "").slice(-1) ||
              cleanVal.slice(-1);
            if (isValidCharacter(newChar, inputType)) {
              currentValues[index] = newChar;
              context.set("value", currentValues);
              advanceFocusOrBlur(
                { context, computed, refs },
                index + 1,
                length,
              );
              return;
            }
          }

          const validChars = cleanVal
            .split("")
            .filter((c: string) => isValidCharacter(c, inputType));

          if (validChars.length === 0) {
            prop("onValueInvalid")?.({ value: cleanVal, index });
            prop("component")?.triggerEvent?.("invalid", {
              value: cleanVal,
              index,
            });
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
          advanceFocusOrBlur({ context, computed, refs }, writeIdx, length);
          return;
        }

        const char = cleanVal;
        if (!isValidCharacter(char, inputType)) {
          prop("onValueInvalid")?.({ value: char, index });
          prop("component")?.triggerEvent?.("invalid", { value: char, index });
          return;
        }

        currentValues[index] = char;
        context.set("value", currentValues);
        advanceFocusOrBlur({ context, computed, refs }, index + 1, length);
      },

      setValue: ({ context, event }) => {
        const length = context.get("length");
        const raw = (event as any).value;
        context.set("value", normalizePinValue(raw, length));
      },

      clearValue: ({ context }) => {
        const length = context.get("length");
        context.set("value", Array(length).fill(""));
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
