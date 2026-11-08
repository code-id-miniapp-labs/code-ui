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
  const value = context.get("value") ?? "";
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const size = computed("effectiveSize");
  const invalid = computed("isInvalid");
  const variant = prop("variant") ?? "outline";
  const color = prop("color") ?? "primary";
  const highlight = Boolean(prop("highlight"));
  const placeholder = prop("placeholder") ?? "";
  const maxlength = prop("maxlength") ?? -1;
  const autoHeight = Boolean(prop("autoHeight"));
  const name = prop("name") ?? "";

  const isFilled = computed("isFilled");
  const isEmptyVal = computed("isEmpty");
  const isClearable = computed("isClearable");
  const characterCount = computed("characterCount");

  const leadingId = dom.getLeadingId(scope);
  const trailingId = dom.getTrailingId(scope);
  const clearId = dom.getClearButtonId(scope);
  const countId = dom.getCountId(scope);
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
    autoHeight,
    "aria-role": "textbox",
    "aria-multiline": true,
  };

  return {
    state: currentState,
    value,
    variant,
    color,
    highlight,
    isEmpty: isEmptyVal,
    isFilled,
    isClearable,
    characterCount,
    invalid,
    disabled,
    readOnly,
    size,
    autoHeight,

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

    handleInput(event: any): string | void {
      const val = event?.detail?.value ?? event?.target?.value ?? "";
      send({
        type: "TEXTAREA.CHANGE",
        value: val,
        cursor: event?.detail?.cursor,
      });
      return val;
    },

    handleFocus(_event: any) {
      send({ type: "TEXTAREA.FOCUS" });
    },

    handleBlur(_event?: any) {
      send({ type: "TEXTAREA.BLUR" });
    },

    handleConfirm(event?: any) {
      send({ type: "TEXTAREA.CONFIRM", value: event?.detail?.value ?? value });
    },

    handleLineChange(event?: any) {
      const raw = event?.detail ?? event ?? {};
      const height = typeof raw.height === "number" ? raw.height : 0;
      const lineHeight =
        typeof raw.lineHeight === "number" ? raw.lineHeight : 0;
      let lineCount = typeof raw.lineCount === "number" ? raw.lineCount : 1;
      if (!value || value.length === 0) {
        lineCount = 1;
      } else if (lineHeight > 0 && height > 0) {
        lineCount = Math.max(1, Math.round(height / lineHeight));
      }

      const details: TextareaLineChangeDetails = {
        ...raw,
        height,
        lineHeight,
        lineCount,
      };
      send({ type: "TEXTAREA.LINE_CHANGE", details });
    },

    handleClear(_event?: any) {
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

    leadingProps: {
      ...(leadingId ? { id: leadingId } : {}),
      "aria-hidden": "true",
    },

    trailingProps: {
      ...(trailingId ? { id: trailingId } : {}),
      "aria-hidden": "true",
    },

    clearButtonProps: {
      ...(clearId ? { id: clearId } : {}),
      "aria-role": "button",
      "aria-label": "Clear textarea",
    },

    countProps: {
      ...(countId ? { id: countId } : {}),
      "aria-live": "polite",
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
