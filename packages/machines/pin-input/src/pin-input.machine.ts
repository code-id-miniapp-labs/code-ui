import { createMachine } from "@code-ui/core";
import { bindFormField } from "@code-ui/form/context";
import { isEmpty, isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  PinInputColor,
  PinInputMachine,
  PinInputSchema,
  PinInputSize,
  PinInputType,
  PinInputVariant,
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

export const pinInputMachine: PinInputMachine = createMachine<PinInputSchema>({
  props: ({ props }) => ({
    ...defaultPinInputProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    return prop("autoFocus") ? "focused" : "idle";
  },

  refs: ({ prop }) => {
    const len = prop("length") ?? 4;
    const raw = prop("value") ?? prop("defaultValue");
    const initial =
      raw !== undefined && raw !== null
        ? normalizePinValue(raw, len)
        : Array(len).fill("");
    return {
      initialValue: [...initial],
      formField: undefined,
      busDisposers: [],
    };
  },

  context: ({ prop, bindable, getRefs }) => ({
    length: bindable<number>(() => ({
      value: prop("length"),
      defaultValue: 4,
    })),

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
        isEqual: (a, b) => {
          if (a === b) return true;
          if (!Array.isArray(a) || !Array.isArray(b)) return false;
          if (a.length !== b.length) return false;
          for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
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

    focusedIndex: bindable<number>(() => ({
      defaultValue: prop("autoFocus") ? 0 : -1,
    })),

    variant: bindable<PinInputVariant>(() => ({
      value: prop("variant"),
      defaultValue: "outline",
    })),

    color: bindable<PinInputColor>(() => ({
      value: prop("color"),
      defaultValue: "primary",
    })),

    size: bindable<PinInputSize>(() => ({
      value: prop("size"),
      defaultValue: "md",
    })),

    highlight: bindable<boolean>(() => ({
      value: prop("highlight"),
      defaultValue: false,
    })),

    disabled: bindable<boolean>(() => ({
      value: prop("disabled"),
      defaultValue: false,
    })),

    readOnly: bindable<boolean>(() => ({
      value: prop("readOnly"),
      defaultValue: false,
    })),

    formDisabled: bindable<boolean>(() => ({
      defaultValue: false,
    })),

    formReadOnly: bindable<boolean>(() => ({
      defaultValue: false,
    })),

    fieldDisabled: bindable<boolean>(() => ({
      value: prop("fieldDisabled"),
      defaultValue: false,
    })),

    fieldSize: bindable<any>(() => ({
      value: prop("fieldSize"),
      defaultValue: "",
    })),

    invalid: bindable<boolean>(() => {
      const rawInvalid = prop("invalid");
      return {
        value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
        defaultValue: false,
      };
    }),

    mask: bindable<boolean>(() => ({
      value: prop("mask"),
      defaultValue: false,
    })),

    otp: bindable<boolean>(() => ({
      value: prop("otp"),
      defaultValue: true,
    })),

    type: bindable<PinInputType>(() => ({
      value: prop("type"),
      defaultValue: "numeric",
    })),

    placeholder: bindable<string>(() => ({
      value: prop("placeholder"),
      defaultValue: "",
    })),

    separator: bindable<any>(() => ({
      value: prop("separator"),
      defaultValue: false,
    })),

    separatorChar: bindable<string>(() => ({
      value: prop("separatorChar"),
      defaultValue: "-",
    })),

    blurOnComplete: bindable<boolean>(() => ({
      value: prop("blurOnComplete"),
      defaultValue: false,
    })),

    selectOnFocus: bindable<boolean>(() => ({
      value: prop("selectOnFocus"),
      defaultValue: false,
    })),

    form: bindable<string>(() => ({
      value: prop("form"),
      defaultValue: "",
    })),

    name: bindable<string>(() => ({
      value: prop("name"),
      defaultValue: "",
    })),

    ui: bindable<any>(() => ({
      value: prop("ui") ?? {},
      defaultValue: {},
    })),
  }),

  computed: {
    valueAsString: ({ context }) => context.get("value").join(""),
    isValueComplete: ({ context }) => {
      const val = context.get("value");
      const len = context.get("length");
      return val.length === len && val.every((char) => !isEmpty(char));
    },
    isEmpty: ({ context }) => isEmpty(context.get("value")),
    isFilled: ({ context }) => !isEmpty(context.get("value")),
  },

  watch: ({ prop, context, refs }) => {
    const controlledVal = prop("value");
    if (controlledVal !== undefined && controlledVal !== null) {
      const len = context.get("length") ?? prop("length") ?? 4;
      const normalized = normalizePinValue(controlledVal, len);
      const current = context.get("value");
      const isSame =
        Array.isArray(current) &&
        current.length === normalized.length &&
        current.every((c, i) => c === normalized[i]);
      if (!isSame) {
        context.set("value", normalized);
      }
    }
    const controlledInvalid = prop("invalid");
    if (isNotNull(controlledInvalid)) {
      context.set("invalid", Boolean(controlledInvalid));
    }
    const controlledFieldDisabled = prop("fieldDisabled");
    if (controlledFieldDisabled !== undefined) {
      context.set("fieldDisabled", controlledFieldDisabled);
    }
    const controlledFieldSize = prop("fieldSize");
    if (controlledFieldSize !== undefined) {
      context.set("fieldSize", controlledFieldSize);
    }
    const nextForm = prop("form") ?? "";
    const nextName = prop("name") ?? "";
    if (nextForm !== context.get("form") || nextName !== context.get("name")) {
      context.set("form", nextForm);
      context.set("name", nextName);
      refs.get("formField")?.rebind();
    }
    const nextFormBus = prop("formBus");
    const prevFormBus = refs.get("currentFormBus");
    if (nextFormBus !== prevFormBus) {
      refs.set("currentFormBus", nextFormBus);
      refs.get("formField")?.rebind(nextFormBus ?? null);
    }
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  on: {
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
        SET_VALUE: {
          actions: ["setValue"],
        },
        CLEAR_VALUE: {
          actions: ["clearValue"],
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
        SET_VALUE: {
          actions: ["setValue"],
        },
        CLEAR_VALUE: {
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
        refs.get("formField")?.dispose();

        refs.set("currentFormBus", prop("formBus"));

        let suppressEmit = false;

        const bound = bindFormField({
          component: prop("component"),
          bus: prop("formBus"),
          id: scope.id ?? "pin-input",
          getFormId: () => context.get("form") || prop("form") || "",
          getName: () => context.get("name") || prop("name") || "",
          getValue: () => computed("valueAsString"),
          setValue: (rawVal: any) => {
            suppressEmit = true;
            try {
              const len = context.get("length");
              context.set("value", normalizePinValue(rawVal, len));
            } finally {
              suppressEmit = false;
            }
          },
          resetValue: () => {
            suppressEmit = true;
            try {
              const len = context.get("length");
              const initial =
                refs.get("initialValue") ??
                prop("defaultValue") ??
                Array(len).fill("");
              context.set("value", normalizePinValue(initial, len));
              context.set("focusedIndex", -1);
              context.set("invalid", false);
              state.set("idle");
            } finally {
              suppressEmit = false;
            }
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
          isDisabled: () =>
            Boolean(
              context.get("disabled") ||
              context.get("formDisabled") ||
              context.get("fieldDisabled"),
            ),
          onValidationChange: (valState) => {
            context.set("invalid", !valState.isValid);
          },
          onFormStateChange: ({ disabled, readOnly }) => {
            context.set("formDisabled", disabled);
            context.set("formReadOnly", readOnly);
          },
        });

        const bus = bound.bus;
        const disposers: Array<() => void> = [];
        if (bus) {
          disposers.push(
            bus.on("field:state", (payload: any) => {
              const currentName = context.get("name") || prop("name");
              if (!payload?.name || payload.name === currentName) {
                if (payload.disabled !== undefined) {
                  context.set("fieldDisabled", Boolean(payload.disabled));
                }
                if (payload.size !== undefined) {
                  context.set("fieldSize", payload.size);
                }
              }
            }),
          );

          disposers.push(
            bus.on("form:state", (payload: any) => {
              if (payload?.disabled !== undefined) {
                context.set("formDisabled", Boolean(payload.disabled));
              }
              if (payload?.readOnly !== undefined) {
                context.set("formReadOnly", Boolean(payload.readOnly));
              }
            }),
          );
        }
        refs.set("busDisposers", disposers);

        // Wrap emitInput and emitChange to respect suppressEmit during Form-driven setValue/resetValue
        const origEmitInput = bound.emitInput.bind(bound);
        const origEmitChange = bound.emitChange.bind(bound);
        bound.emitInput = (val: any) => {
          if (!suppressEmit) origEmitInput(val);
        };
        bound.emitChange = (val: any) => {
          if (!suppressEmit) origEmitChange(val);
        };

        refs.set("formField", bound);
      },

      cleanupFormField: ({ refs }) => {
        refs.get("formField")?.dispose();
        refs.set("formField", undefined);
        refs.set("currentFormBus", undefined);
        const disposers = refs.get("busDisposers") ?? [];
        for (let i = 0; i < disposers.length; i++) {
          disposers[i]?.();
        }
        refs.set("busDisposers", []);
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
        if (
          context.get("disabled") ||
          context.get("formDisabled") ||
          context.get("fieldDisabled") ||
          context.get("readOnly") ||
          context.get("formReadOnly")
        ) {
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
        if (
          context.get("disabled") ||
          context.get("formDisabled") ||
          context.get("fieldDisabled") ||
          context.get("readOnly") ||
          context.get("formReadOnly")
        ) {
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

              if (
                computed("isValueComplete") &&
                context.get("blurOnComplete")
              ) {
                context.set("focusedIndex", -1);
                const formField = refs.get("formField");

                if (formField) {
                  formField.emitBlur(computed("valueAsString"));
                }
              } else {
                const nextIndex = Math.min(length - 1, index + 1);
                context.set("focusedIndex", nextIndex);
              }
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

          if (computed("isValueComplete") && context.get("blurOnComplete")) {
            context.set("focusedIndex", -1);
            const formField = refs.get("formField");

            if (formField) {
              formField.emitBlur(computed("valueAsString"));
            }
          } else {
            const nextFocus = Math.min(length - 1, writeIdx);
            context.set("focusedIndex", nextFocus);
          }
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

        const isComplete =
          currentValues.length === length &&
          currentValues.every((c) => !isEmpty(c));

        if (isComplete && context.get("blurOnComplete")) {
          context.set("focusedIndex", -1);
          const formField = refs.get("formField");

          if (formField) {
            formField.emitBlur(computed("valueAsString"));
          }
        } else {
          const nextIndex = Math.min(length - 1, index + 1);
          context.set("focusedIndex", nextIndex);
        }
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
