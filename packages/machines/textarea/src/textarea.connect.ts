import type { MiniAppBaseEventLike, MiniAppEventLike } from "@code-ui/utils";
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
  const size = computed("effectiveSize");
  const invalid = computed("isInvalid");
  const placeholder = prop("placeholder");
  const maxlength = prop("maxlength");
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
    placeholder,
    maxlength,
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
    size,

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

    handleInput(
      event: MiniAppEventLike<{ value: string; cursor?: number }>,
    ): string | void {
      const val = event.detail.value;
      send({
        type: "TEXTAREA.CHANGE",
        value: val,
        cursor: event.detail.cursor,
      });
      return val;
    },

    handleFocus(_event?: MiniAppBaseEventLike) {
      send({ type: "TEXTAREA.FOCUS" });
    },

    handleBlur(_event?: MiniAppBaseEventLike) {
      send({ type: "TEXTAREA.BLUR" });
    },

    handleConfirm(event?: MiniAppEventLike<{ value?: string }>) {
      send({ type: "TEXTAREA.CONFIRM", value: event?.detail?.value ?? value });
    },

    handleLineChange(
      event: MiniAppEventLike<Partial<TextareaLineChangeDetails>>,
    ) {
      send({ type: "TEXTAREA.LINE_CHANGE", detail: event.detail });
    },

    handleClear(_event?: MiniAppBaseEventLike) {
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
