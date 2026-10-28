import type { InputApi, InputService } from "./input.types";
import { parts } from "./input.anatomy";
import * as dom from "./input.dom";

export function connectInput(service: InputService): InputApi {
  const { state, send, context, computed, scope } = service;

  const currentState = state.get();
  const isFocused = currentState === "focused";
  const value = context.get("value") ?? "";
  const disabled = computed("isDisabled");
  const readOnly = Boolean(
    context.get("readOnly") || context.get("formReadOnly"),
  );
  const size = computed("effectiveSize");
  const invalid = Boolean(context.get("invalid"));
  const variant = context.get("variant");
  const color = context.get("color");
  const highlight = Boolean(context.get("highlight"));
  const type = context.get("type");
  const password = context.get("password");
  const placeholder = context.get("placeholder");
  const maxlength = context.get("maxlength");
  const name = context.get("name") ?? "";

  const isFilled = computed("isFilled");
  const isEmptyVal = computed("isEmpty");
  const isClearable = computed("isClearable");

  return {
    state: currentState,
    value,
    variant,
    color,
    highlight,
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

    handleInput(event: any): string | void {
      const val = event?.detail?.value ?? event?.target?.value ?? "";
      send({
        type: "INPUT.CHANGE",
        value: val,
        cursor: event?.detail?.cursor,
      });
      return val;
    },

    handleFocus(_event: any) {
      send({ type: "INPUT.FOCUS" });
    },

    handleBlur(_event?: any) {
      send({ type: "INPUT.BLUR" });
    },

    handleConfirm(event?: any) {
      const val = event?.detail?.value ?? value;
      send({ type: "INPUT.CONFIRM", value: val });
    },

    handleClear(_event?: any) {
      send({ type: "INPUT.CLEAR" });
    },

    rootProps: {
      id: dom.getRootId(scope),
      ...parts.root.attrs,
      "data-state": currentState,
      "data-empty": String(isEmptyVal),
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      role: "group",
      "aria-disabled": String(disabled),
      "aria-invalid": String(invalid),
    },

    inputProps: {
      id: dom.getInputId(scope),
      ...parts.base.attrs,
      name: name || undefined,
      "data-state": currentState,
      "data-empty": String(isEmptyVal),
      "data-focused": String(isFocused),
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      value,
      focus: isFocused,
      disabled: disabled || readOnly,
      type,
      password,
      placeholder,
      maxlength,
      role: "textbox",
      "aria-invalid": String(invalid),
    },

    leadingProps: {
      id: dom.getLeadingId(scope),
      ...parts.leading.attrs,
      "aria-hidden": "true",
    },

    trailingProps: {
      id: dom.getTrailingId(scope),
      ...parts.trailing.attrs,
      "aria-hidden": "true",
    },

    clearButtonProps: {
      id: dom.getClearButtonId(scope),
      ...parts.clear.attrs,
      role: "button",
      "aria-label": "Clear input",
    },

    hiddenInputProps: {
      id: dom.getHiddenInputId(scope),
      type: "text",
      tabIndex: -1,
      name: name || undefined,
      value,
      disabled: disabled || readOnly,
      "aria-hidden": "true",
    },
  };
}
