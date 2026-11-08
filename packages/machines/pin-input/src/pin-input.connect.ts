import type {
  PinInputApi,
  PinInputCell,
  PinInputSeparator,
  PinInputService,
} from "./pin-input.types";
import * as dom from "./pin-input.dom";
import { isValidCharacter } from "./pin-input.machine";

function shouldShowSeparator(
  index: number,
  separator: PinInputSeparator,
  length: number,
): boolean {
  if (index >= length - 1 || !separator) return false;
  if (typeof separator === "number" && separator > 0) {
    return (index + 1) % separator === 0;
  }
  if (Array.isArray(separator)) return separator.includes(index + 1);
  return separator === true && index + 1 === Math.floor(length / 2);
}

function getEventIndex(event: any, fallback: number): number {
  return Number(
    event?.currentTarget?.dataset?.index ??
      event?.target?.dataset?.index ??
      fallback,
  );
}

export function connectPinInput(service: PinInputService): PinInputApi {
  const { state, send, context, computed, prop, scope } = service;

  const currentState = state.get();
  const isMachineFocused = currentState === "focused";
  const value = context.get("value") ?? [];
  const length = context.get("length") ?? 4;
  const focusedIndex = isMachineFocused ? context.get("focusedIndex") : -1;
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const size = computed("effectiveSize");
  const invalid = computed("isInvalid");
  const variant = prop("variant") ?? "outline";
  const color = prop("color") ?? "primary";
  const highlight = Boolean(prop("highlight"));
  const mask = Boolean(prop("mask"));
  const type = prop("type") ?? "numeric";
  const placeholder = prop("placeholder") ?? "";
  const separator = prop("separator") ?? false;
  const separatorChar = prop("separatorChar") ?? "-";
  const name = prop("name") ?? "";

  const isValueComplete = computed("isValueComplete");
  const isEmptyVal = computed("isEmpty");
  const isFilled = computed("isFilled");
  const valueAsString = computed("valueAsString");

  function getInputProps(index: number): Record<string, any> {
    const isFocused = isMachineFocused && focusedIndex === index;
    const rawVal = value[index] ?? "";

    return {
      id: dom.getInputId(scope, index),
      "data-index": index,
      "data-state": isFocused ? "focused" : "idle",
      "data-disabled": String(disabled),
      "data-focused": String(isFocused),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      "data-complete": String(isValueComplete),
      value: rawVal || (isFocused ? "\u200B" : ""),
      focus: isFocused,
      disabled: disabled || readOnly,
      type: type === "numeric" ? "number" : "text",
      password: Boolean(mask && rawVal),
      placeholder: rawVal ? "" : placeholder,
      maxlength: index === 0 ? Math.max(length, 2) : 2,
      "aria-role": "textbox",
      "aria-label": `Digit ${index + 1}`,
      "aria-invalid": invalid,
    };
  }

  function getSeparatorProps(index: number): Record<string, any> {
    const sepId = dom.getSeparatorId(scope, index);
    return {
      ...(sepId ? { id: sepId } : {}),
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

  const controlId = dom.getControlId(scope);
  const hiddenId = dom.getHiddenInputId(scope);

  return {
    state: currentState,
    value,
    variant,
    color,
    highlight,
    valueAsString,
    isValueComplete,
    isEmpty: isEmptyVal,
    isFilled,
    invalid,
    disabled,
    readOnly,
    size,
    focusedIndex,
    inputs,

    setValue(nextVal: string[] | string) {
      send({ type: "SET_VALUE", value: nextVal });
    },

    clearValue() {
      send({ type: "CLEAR_VALUE" });
    },

    resetValue() {
      send({ type: "RESET_VALUE" });
    },

    focus(index?: number) {
      send({ type: "INPUT.FOCUS", index: index ?? 0, force: true });
    },

    handleInput(event: any): string | void {
      const idx = getEventIndex(event, 0);
      const val = event?.detail?.value ?? event?.target?.value ?? "";
      send({ type: "INPUT.CHANGE", index: idx, value: val });

      const cleanVal = (typeof val === "string" ? val : "").replace(
        /\u200B/g,
        "",
      );
      if (cleanVal === "") return "";

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

      return (
        cleanVal.split("").find((c: string) => isValidCharacter(c, type)) ??
        currentVal
      );
    },

    handleFocus(event: any) {
      send({
        type: "INPUT.FOCUS",
        index: getEventIndex(event, 0),
        force: true,
      });
    },

    handleTap(event: any) {
      send({
        type: "INPUT.FOCUS",
        index: getEventIndex(event, 0),
        force: true,
      });
    },

    handleBlur(event?: any) {
      send({ type: "INPUT.BLUR", index: getEventIndex(event, -1) });
    },

    getInputProps,

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      "data-disabled": String(disabled),
      "data-empty": String(isEmptyVal),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      "data-complete": String(isValueComplete),
      "aria-role": "group",
      "aria-disabled": disabled,
      "aria-invalid": invalid,
    },

    controlProps: {
      ...(controlId ? { id: controlId } : {}),
      "data-disabled": String(disabled),
      "data-invalid": String(invalid),
    },

    labelProps: {
      id: dom.getLabelId(scope),
    },

    hiddenInputProps: {
      ...(hiddenId ? { id: hiddenId } : {}),
      type: "text",
      name: name || undefined,
      value: valueAsString,
      disabled: disabled || readOnly,
      "aria-hidden": "true",
    },

    getSeparatorProps,
  };
}
