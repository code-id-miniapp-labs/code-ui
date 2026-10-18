import type {
  InputApi,
  InputService,
} from "./input.types";
import { parts } from "./input.anatomy";
import * as dom from "./input.dom";

export function connectInput(service: InputService): InputApi {
  const { state, send, context, computed, scope } = service;

  const currentState = state.get();
  const isFocused = currentState === "focused";
  const value = context.get("value") ?? "";
  const disabled = Boolean(
    context.get("disabled") ||
      context.get("formDisabled") ||
      context.get("fieldDisabled"),
  );
  const readOnly = Boolean(
    context.get("readOnly") || context.get("formReadOnly"),
  );
  const rawSize = service.prop("size");
  const fieldSize = context.get("fieldSize");
  const size =
    rawSize && rawSize !== "md"
      ? rawSize
      : ((fieldSize || rawSize || "md") as any);
  const invalid = Boolean(context.get("invalid"));
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
      "data-empty": isEmptyVal ? "true" : "false",
      "data-disabled": disabled ? "true" : "false",
      "data-readonly": readOnly ? "true" : "false",
      "data-invalid": invalid ? "true" : "false",
      role: "group",
      "aria-disabled": disabled ? "true" : "false",
      "aria-invalid": invalid ? "true" : "false",
    },

    inputProps: {
      id: dom.getInputId(scope),
      ...parts.base.attrs,
      name: name || undefined,
      "data-state": currentState,
      "data-empty": isEmptyVal ? "true" : "false",
      "data-focused": isFocused ? "true" : "false",
      "data-disabled": disabled ? "true" : "false",
      "data-readonly": readOnly ? "true" : "false",
      "data-invalid": invalid ? "true" : "false",
      value,
      focus: isFocused,
      disabled: disabled || readOnly,
      type,
      password,
      placeholder,
      maxlength,
      role: "textbox",
      "aria-invalid": invalid ? "true" : "false",
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
