import type {
  TextareaApi,
  TextareaLineChangeDetails,
  TextareaService,
} from "./textarea.types";
import * as dom from "./textarea.dom";

export function connectTextarea(service: TextareaService): TextareaApi {
  const { state, send, context, computed, prop, scope } = service;

  const currentState = state.get();
  const isFocused = currentState === "focused";
  const value = context.get("value");
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const invalid = computed("isInvalid");
  const name = prop("name");

  const isFilled = computed("isFilled");
  const isEmptyVal = computed("isEmpty");
  const isClearable = computed("isClearable");
  const characterCount = computed("characterCount");

  const hiddenId = dom.getHiddenInputId(scope);

  const textareaProps = {
    id: dom.getTextareaId(scope),
    ...(name ? { name } : {}),
    "data-state": currentState,
    "data-disabled": String(disabled),
    "data-readonly": String(readOnly),
    "data-invalid": String(invalid),
    "data-focused": String(isFocused),
    value,
    focus: isFocused,
    disabled: disabled || readOnly,
    "aria-role": "textbox",
    "aria-multiline": true,
  };

  return {
    state: currentState,
    value,
    isEmpty: isEmptyVal,
    isFilled,
    isClearable,
    characterCount,
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
      send({ type: "TEXTAREA.FOCUS" });
    },

    blur() {
      send({ type: "TEXTAREA.BLUR" });
    },

    handleInput(nextValue: string, cursor?: number): string | void {
      send({
        type: "TEXTAREA.CHANGE",
        value: nextValue,
        cursor,
      });
      return nextValue;
    },

    handleFocus() {
      send({ type: "TEXTAREA.FOCUS" });
    },

    handleBlur() {
      send({ type: "TEXTAREA.BLUR" });
    },

    handleConfirm(nextValue?: string) {
      send({ type: "TEXTAREA.CONFIRM", value: nextValue ?? value });
    },

    handleLineChange(detail: Partial<TextareaLineChangeDetails>) {
      send({ type: "TEXTAREA.LINE_CHANGE", detail });
    },

    handleClear() {
      send({ type: "TEXTAREA.CLEAR" });
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

    textareaProps,
    inputProps: textareaProps,

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
