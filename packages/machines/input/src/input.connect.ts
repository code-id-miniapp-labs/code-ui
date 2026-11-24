import type { InputApi, InputService } from "./input.types";
import * as dom from "./input.dom";

export function connectInput(service: InputService): InputApi {
  const { state, send, context, computed, prop, scope } = service;

  const currentState = state.get();
  const isFocused = currentState === "focused";
  const nativeFocus = isFocused && context.get("programmaticFocus");
  const value = context.get("value");
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const invalid = computed("isInvalid");
  const name = prop("name");

  const isFilled = computed("isFilled");
  const isEmptyVal = computed("isEmpty");
  const isClearable = computed("isClearable");

  const hiddenId = dom.getHiddenInputId(scope);

  return {
    state: currentState,
    value,
    isEmpty: isEmptyVal,
    isFilled,
    isClearable,
    invalid,
    disabled,
    readOnly,

    setValue(nextVal: string | number) {
      send({ type: "SET_VALUE", value: nextVal });
    },

    clearValue() {
      send({ type: "CLEAR_VALUE" });
    },

    resetValue() {
      send({ type: "RESET_VALUE" });
    },

    focus() {
      send({ type: "INPUT.FOCUS", programmatic: true });
    },

    blur() {
      send({ type: "INPUT.BLUR" });
    },

    handleInput(nextValue: string, cursor?: number): string | void {
      send({
        type: "INPUT.CHANGE",
        value: nextValue,
        cursor,
      });
      return nextValue;
    },

    handleFocus() {
      send({ type: "INPUT.FOCUS" });
    },

    handleBlur() {
      send({ type: "INPUT.BLUR" });
    },

    handleConfirm(nextValue?: string) {
      send({ type: "INPUT.CONFIRM", value: nextValue ?? value });
    },

    handleClear() {
      send({ type: "INPUT.CLEAR" });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      "aria-role": "group",
      "aria-disabled": disabled,
      "aria-invalid": invalid,
    },

    inputProps: {
      id: dom.getInputId(scope),
      ...(name ? { name } : {}),
      "data-state": currentState,
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      "data-focused": String(isFocused),
      value,
      focus: nativeFocus,
      disabled: disabled || readOnly,
      "aria-role": "textbox",
      ...(invalid ? { "aria-invalid": true } : {}),
    },

    hiddenInputProps: {
      ...(hiddenId ? { id: hiddenId } : {}),
      type: "text",
      name: name || undefined,
      value,
      disabled: disabled || readOnly,
      "aria-hidden": "true",
    },
  };
}
