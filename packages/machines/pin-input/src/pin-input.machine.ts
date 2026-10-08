import { createMachine } from "@code-ui/core";
import type {
  PinInputMachine,
  PinInputSchema,
  PinInputType,
} from "./pin-input.types";
import { defaultPinInputProps } from "./pin-input.props";

function isValidCharacter(char: string, type: PinInputType): boolean {
  if (type === "numeric") {
    return /^[0-9]$/.test(char);
  }
  if (type === "alphabetic") {
    return /^[a-zA-Z]$/.test(char);
  }
  return /^[a-zA-Z0-9]$/.test(char);
}

export const pinInputMachine: PinInputMachine = createMachine<PinInputSchema>({
  props: ({ props }) => ({
    ...defaultPinInputProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    return prop("autoFocus") ? "focused" : "idle";
  },

  context: ({ prop, bindable }) => ({
    length: bindable<number>(() => ({
      value: prop("length"),
      defaultValue: 4,
    })),

    value: bindable<string[]>(() => {
      const len = prop("length") ?? 4;
      const initial =
        prop("value") ?? prop("defaultValue") ?? Array(len).fill("");
      return {
        value: prop("value"),
        defaultValue: initial,
        onChange: (nextVal) => {
          const valueAsString = nextVal.join("");
          prop("onValueChange")?.({ value: nextVal, valueAsString });

          const isComplete =
            nextVal.length === (prop("length") ?? 4) &&
            nextVal.every((c) => Boolean(c && c.trim() !== ""));
          if (isComplete) {
            prop("onValueComplete")?.({ value: nextVal, valueAsString });
          }
        },
      };
    }),

    focusedIndex: bindable<number>(() => ({
      defaultValue: prop("autoFocus") ? 0 : -1,
    })),

    disabled: bindable<boolean>(() => ({
      value: prop("disabled"),
      defaultValue: false,
    })),

    readOnly: bindable<boolean>(() => ({
      value: prop("readOnly"),
      defaultValue: false,
    })),

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
      return (
        val.length === len &&
        val.every((char) => Boolean(char && char.trim() !== ""))
      );
    },
    isFilled: ({ context }) => {
      const val = context.get("value");
      return val.some((char) => Boolean(char && char.trim() !== ""));
    },
  },

  watch: ({ prop, context }) => {
    const controlledVal = prop("value");
    if (controlledVal !== undefined) {
      context.set("value", controlledVal);
    }
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
        "INPUT.BLUR": {
          target: "idle",
          actions: ["resetFocusedIndex"],
        },
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
    actions: {
      setFocusedIndex: ({ context, event }) => {
        if (context.get("disabled") || context.get("readOnly")) return;
        const len = context.get("length");
        const idx = typeof event.index === "number" ? event.index : 0;
        context.set("focusedIndex", Math.max(0, Math.min(len - 1, idx)));
      },

      resetFocusedIndex: ({ context }) => {
        context.set("focusedIndex", -1);
      },

      handleInputChange: ({ context, prop, computed, event }) => {
        if (context.get("disabled") || context.get("readOnly")) return;

        const { index, value: rawVal } = event as any;
        const length = context.get("length");
        const inputType = context.get("type");
        const currentValues = [...context.get("value")];

        // Ensure array is of correct length
        while (currentValues.length < length) {
          currentValues.push("");
        }

        // Case 1: Deletion / Backspace (value cleared)
        if (rawVal === "" || rawVal === undefined) {
          currentValues[index] = "";
          context.set("value", currentValues);

          // Auto-retreat focus to previous slot
          const prevIndex = Math.max(0, index - 1);
          context.set("focusedIndex", prevIndex);
          return;
        }

        // Case 2: Pasted or Autofilled string (multi-character)
        if (rawVal.length > 1) {
          const validChars = rawVal
            .split("")
            .filter((c: string) => isValidCharacter(c, inputType));

          if (validChars.length === 0) {
            prop("onValueInvalid")?.({ value: rawVal, index });
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
          } else {
            const nextFocus = Math.min(length - 1, writeIdx);
            context.set("focusedIndex", nextFocus);
          }
          return;
        }

        // Case 3: Single character input
        const char = rawVal.slice(-1);
        if (!isValidCharacter(char, inputType)) {
          prop("onValueInvalid")?.({ value: char, index });
          return;
        }

        currentValues[index] = char;
        context.set("value", currentValues);

        // Advance focus to next slot
        const isComplete =
          currentValues.length === length &&
          currentValues.every((c) => Boolean(c && c.trim() !== ""));

        if (isComplete && context.get("blurOnComplete")) {
          context.set("focusedIndex", -1);
        } else {
          const nextIndex = Math.min(length - 1, index + 1);
          context.set("focusedIndex", nextIndex);
        }
      },

      setValue: ({ context, event }) => {
        const length = context.get("length");
        const raw = (event as any).value;
        const chars = Array.isArray(raw) ? raw : String(raw).split("");
        const nextValues = Array(length).fill("");
        for (let i = 0; i < length; i++) {
          nextValues[i] = chars[i] ?? "";
        }
        context.set("value", nextValues);
      },

      clearValue: ({ context }) => {
        const length = context.get("length");
        context.set("value", Array(length).fill(""));
        context.set("focusedIndex", 0);
      },
    },
  },
});
