import type {
  PinInputApi,
  PinInputCell,
  PinInputSeparator,
  PinInputService,
} from "./pin-input.types";
import { parts } from "./pin-input.anatomy";
import * as dom from "./pin-input.dom";
import { isValidCharacter } from "./pin-input.machine";

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
  const isMachineFocused = currentState === "focused";
  const value = context.get("value") ?? [];
  const length = context.get("length") ?? 4;
  const focusedIndex = isMachineFocused ? context.get("focusedIndex") : -1;
  const disabled = context.get("disabled");
  const readOnly = context.get("readOnly");
  const mask = context.get("mask");
  const type = context.get("type");
  const placeholder = context.get("placeholder");
  const separator = context.get("separator");
  const separatorChar = context.get("separatorChar") ?? "-";
  const name = context.get("name") ?? "";

  const isValueComplete = computed("isValueComplete");
  const isFilled = computed("isFilled");
  const valueAsString = computed("valueAsString");

  function getInputProps(index: number): Record<string, any> {
    const isFocused = isMachineFocused && focusedIndex === index;
    const rawVal = value[index] ?? "";
    const displayVal = rawVal || (isFocused ? "\u200B" : "");

    return {
      id: dom.getInputId(scope, index),
      ...parts.input.attrs,
      "data-index": index,
      "data-focused": isFocused ? "true" : "false",
      "data-disabled": disabled ? "true" : "false",
      "data-readonly": readOnly ? "true" : "false",
      "data-complete": isValueComplete ? "true" : "false",
      "data-state": isFocused ? "focused" : "idle",
      value: displayVal,
      focus: isFocused,
      disabled: disabled || readOnly,
      type: type === "numeric" ? "number" : "text",
      password: Boolean(mask && rawVal),
      placeholder: rawVal ? "" : placeholder,
      maxlength: index === 0 ? Math.max(length, 2) : 2,
      role: "textbox",
      "aria-label": `Digit ${index + 1}`,
    };
  }

  function getSeparatorProps(index: number): Record<string, any> {
    return {
      id: dom.getSeparatorId(scope, index),
      ...parts.separator.attrs,
      "aria-hidden": "true",
    };
  }

  const inputs: PinInputCell[] = Array.from({ length }).map((_, index) => ({
    index,
    value: value[index] ?? "",
    isFocused: isMachineFocused && focusedIndex === index,
    hasSeparator: shouldShowSeparator(index, separator, length),
    separatorChar,
    inputProps: getInputProps(index),
    separatorProps: getSeparatorProps(index),
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
      send({ type: "INPUT.FOCUS", index: index ?? 0, force: true });
    },

    handleInput(event: any): string | void {
      const idx = Number(
        event?.currentTarget?.dataset?.index ??
          event?.target?.dataset?.index ??
          0,
      );
      const val = event?.detail?.value ?? event?.target?.value ?? "";
      send({ type: "INPUT.CHANGE", index: idx, value: val });

      const cleanVal = (typeof val === "string" ? val : "").replace(
        /\u200B/g,
        "",
      );

      if (cleanVal === "") {
        return "";
      }

      const currentVal = value[idx] ?? "";
      if (cleanVal.length === 1) {
        return isValidCharacter(cleanVal, type) ? cleanVal : currentVal;
      }

      if (
        currentVal &&
        cleanVal.includes(currentVal) &&
        (cleanVal.length === 2 || idx === length - 1)
      ) {
        const newChar =
          cleanVal.replace(currentVal, "").slice(-1) || cleanVal.slice(-1);
        return isValidCharacter(newChar, type) ? newChar : currentVal;
      }

      const validChar = cleanVal
        .split("")
        .find((c: string) => isValidCharacter(c, type));

      return validChar ?? currentVal;
    },

    handleFocus(event: any) {
      const idx = Number(
        event?.currentTarget?.dataset?.index ??
          event?.target?.dataset?.index ??
          0,
      );
      send({ type: "INPUT.FOCUS", index: idx, force: true });
    },

    handleTap(event: any) {
      const idx = Number(
        event?.currentTarget?.dataset?.index ??
          event?.target?.dataset?.index ??
          0,
      );
      send({ type: "INPUT.FOCUS", index: idx, force: true });
    },

    handleBlur(event?: any) {
      const idx = Number(
        event?.currentTarget?.dataset?.index ??
          event?.target?.dataset?.index ??
          -1,
      );
      send({ type: "INPUT.BLUR", index: idx });
    },

    getInputProps,

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

    hiddenInputProps: {
      id: dom.getHiddenInputId(scope),
      type: "text",
      tabIndex: -1,
      name: name || undefined,
      value: valueAsString,
      disabled: disabled || readOnly,
      "aria-hidden": "true",
    },

    getSeparatorProps,
  };
}
