import type {
  PinInputApi,
  PinInputCell,
  PinInputSeparator,
  PinInputService,
} from "./pin-input.types";
import { parts } from "./pin-input.anatomy";
import * as dom from "./pin-input.dom";

function shouldShowSeparator(
  index: number,
  separator: PinInputSeparator,
  length: number,
): boolean {
  if (index >= length - 1) return false;
  if (!separator) return false;

  if (typeof separator === "number" && separator > 0) {
    return (index + 1) % separator === 0;
  }
  if (Array.isArray(separator)) {
    return separator.includes(index + 1);
  }
  if (separator === true) {
    return index + 1 === Math.floor(length / 2);
  }
  return false;
}

export function connectPinInput(service: PinInputService): PinInputApi {
  const { state, send, context, computed, scope } = service;

  const currentState = state.get();
  const value = context.get("value") ?? [];
  const length = context.get("length") ?? 4;
  const focusedIndex = context.get("focusedIndex");
  const disabled = context.get("disabled");
  const readOnly = context.get("readOnly");
  const mask = context.get("mask");
  const type = context.get("type");
  const placeholder = context.get("placeholder");
  const separator = context.get("separator");
  const separatorChar = context.get("separatorChar") ?? "-";

  const isValueComplete = computed("isValueComplete");
  const isFilled = computed("isFilled");
  const valueAsString = computed("valueAsString");

  const inputs: PinInputCell[] = Array.from({ length }).map((_, index) => ({
    index,
    value: value[index] ?? "",
    isFocused: focusedIndex === index,
    hasSeparator: shouldShowSeparator(index, separator, length),
    separatorChar,
  }));

  return {
    state: currentState,
    value,
    valueAsString,
    isValueComplete,
    isFilled,
    focusedIndex,
    inputs,

    setValue(nextVal: string[] | string) {
      send({ type: "SET_VALUE", value: nextVal });
    },

    clearValue() {
      send({ type: "CLEAR_VALUE" });
    },

    focus(index?: number) {
      send({ type: "INPUT.FOCUS", index: index ?? 0 });
    },

    handleInput(event: any) {
      const idx = Number(
        event?.currentTarget?.dataset?.index ??
          event?.target?.dataset?.index ??
          0,
      );
      const val = event?.detail?.value ?? event?.target?.value ?? "";
      send({ type: "INPUT.CHANGE", index: idx, value: val });
    },

    handleFocus(event: any) {
      const idx = Number(
        event?.currentTarget?.dataset?.index ??
          event?.target?.dataset?.index ??
          0,
      );
      send({ type: "INPUT.FOCUS", index: idx });
    },

    handleBlur() {
      send({ type: "INPUT.BLUR" });
    },

    getInputProps(index: number) {
      return {
        id: dom.getInputId(scope, index),
        ...parts.input.attrs,
        "data-index": index,
        "data-focused": focusedIndex === index ? "true" : "false",
        "data-disabled": disabled ? "true" : "false",
        "data-readonly": readOnly ? "true" : "false",
        "data-state": focusedIndex === index ? "focused" : "idle",
        value: value[index] ?? "",
        focus: focusedIndex === index,
        disabled: disabled || readOnly,
        type: type === "numeric" ? "number" : "text",
        password: mask,
        placeholder,
        maxlength: index === 0 ? length : 1,
        role: "textbox",
        "aria-label": `Digit ${index + 1}`,
      };
    },

    rootProps: {
      id: dom.getRootId(scope),
      ...parts.root.attrs,
      "data-state": currentState,
      "data-disabled": disabled ? "true" : "false",
      "data-readonly": readOnly ? "true" : "false",
      "data-complete": isValueComplete ? "true" : "false",
      role: "group",
      "aria-disabled": disabled ? "true" : "false",
    },

    controlProps: {
      id: dom.getControlId(scope),
      ...parts.control.attrs,
      "data-disabled": disabled ? "true" : "false",
    },

    labelProps: {
      id: dom.getLabelId(scope),
      ...parts.label.attrs,
    },

    getSeparatorProps(index: number) {
      return {
        id: dom.getSeparatorId(scope, index),
        ...parts.separator.attrs,
        "aria-hidden": "true",
      };
    },
  };
}
