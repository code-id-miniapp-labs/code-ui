import type { MiniAppBaseEventLike, MiniAppEventLike } from "@code-ui/utils";
import type { InputApi, InputService } from "./input.types";
import * as dom from "./input.dom";

export function connectInput(service: InputService): InputApi {
  const { state, send, context, computed, prop, scope } = service;

  const currentState = state.get();
  const isFocused = currentState === "focused";
  const value = context.get("value");
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const size = computed("effectiveSize");
  const invalid = computed("isInvalid");
  const type = prop("type");
  const password = prop("password");
  const placeholder = prop("placeholder");
  const maxlength = prop("maxlength");
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
      send({ type: "INPUT.FOCUS" });
    },

    blur() {
      send({ type: "INPUT.BLUR" });
    },

    handleInput(
      event: MiniAppEventLike<{ value: string; cursor?: number }>,
    ): string | void {
      const val = event.detail.value;
      send({
        type: "INPUT.CHANGE",
        value: val,
        cursor: event.detail.cursor,
      });
      return val;
    },

    handleFocus(_event?: MiniAppBaseEventLike) {
      send({ type: "INPUT.FOCUS" });
    },

    handleBlur(_event?: MiniAppBaseEventLike) {
      send({ type: "INPUT.BLUR" });
    },

    handleConfirm(event?: MiniAppEventLike<{ value?: string }>) {
      send({ type: "INPUT.CONFIRM", value: event?.detail?.value ?? value });
    },

    handleClear(_event?: MiniAppBaseEventLike) {
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
      focus: isFocused,
      disabled: disabled || readOnly,
      type,
      password,
      placeholder,
      maxlength,
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
