import type {
  TextareaApi,
  TextareaLineChangeDetails,
  TextareaService,
  TextareaSize,
} from "./textarea.types";
import { parts } from "./textarea.anatomy";
import * as dom from "./textarea.dom";

export function connectTextarea(service: TextareaService): TextareaApi {
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
  const rawSize = context.get("size");
  const fieldSize = context.get("fieldSize");
  const size =
    rawSize && rawSize !== "md"
      ? rawSize
      : ((fieldSize || rawSize || "md") as TextareaSize);
  const invalid = Boolean(context.get("invalid"));
  const variant = context.get("variant");
  const color = context.get("color");
  const highlight = Boolean(context.get("highlight"));
  const placeholder = context.get("placeholder");
  const maxlength = context.get("maxlength");
  const autoHeight = Boolean(context.get("autoHeight"));
  const name = context.get("name") ?? "";

  const isFilled = computed("isFilled");
  const isEmptyVal = computed("isEmpty");
  const isClearable = computed("isClearable");
  const characterCount = computed("characterCount");

  const textareaProps = {
    id: dom.getTextareaId(scope),
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
    placeholder,
    maxlength,
    autoHeight,
    role: "textbox",
    "aria-invalid": invalid ? "true" : "false",
    "aria-multiline": "true",
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
      const val = event?.detail?.value ?? value;
      send({ type: "TEXTAREA.CONFIRM", value: val });
    },

    handleLineChange(event?: any) {
      const raw = event?.detail ?? event ?? {};
      const height = typeof raw.height === "number" ? raw.height : 0;
      const lineHeight = typeof raw.lineHeight === "number" ? raw.lineHeight : 0;
      const rawLineCount = typeof raw.lineCount === "number" ? raw.lineCount : 1;

      let lineCount = rawLineCount;
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

    textareaProps,
    inputProps: textareaProps,

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
      "aria-label": "Clear textarea",
    },

    countProps: {
      id: dom.getCountId(scope),
      ...parts.count.attrs,
      "aria-live": "polite",
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
