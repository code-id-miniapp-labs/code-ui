import type { CheckboxApi, CheckboxService } from "./checkbox.types";
import * as dom from "./checkbox.dom";

export function connectCheckbox(service: CheckboxService): CheckboxApi {
  const { state, send, computed, prop, scope } = service;

  const currentState = state.get();
  const checked = computed("isChecked");
  const indeterminate = computed("isIndeterminate");
  const isInteractive = computed("isInteractive");
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const invalid = computed("isInvalid");
  const required = Boolean(prop("required"));

  const size = computed("effectiveSize");
  const color = computed("effectiveColor");
  const name = prop("name") ?? "";
  const value = prop("value") ?? "";
  const label = prop("label") ?? "";
  const description = prop("description") ?? "";
  const icon = prop("icon") ?? "check";
  const indeterminateIcon = prop("indeterminateIcon") ?? "minus";

  const dataState = indeterminate
    ? "indeterminate"
    : checked
      ? "checked"
      : "unchecked";

  const sharedData = {
    "data-state": dataState,
    "data-disabled": String(disabled),
    "data-checked": String(checked),
    "data-indeterminate": String(indeterminate),
    "data-readonly": String(readOnly),
    "data-invalid": String(invalid),
  };
  const indicatorId = dom.getIndicatorId(scope);
  const descId = dom.getDescriptionId(scope);
  const hiddenId = dom.getHiddenInputId(scope);

  return {
    state: currentState,
    checked,
    isChecked: checked,
    indeterminate,
    isIndeterminate: indeterminate,
    isInteractive,
    disabled,
    readOnly,
    invalid,
    required,
    size,
    color,
    label,
    description,
    icon,
    indeterminateIcon,

    setChecked(nextChecked: boolean) {
      send({ type: "SET_CHECKED", checked: nextChecked });
    },

    setIndeterminate(nextIndeterminate: boolean) {
      send({ type: "SET_INDETERMINATE", indeterminate: nextIndeterminate });
    },

    toggle() {
      send({ type: "TOGGLE" });
    },

    resetChecked() {
      send({ type: "RESET_VALUE" });
    },

    handleTap(_event?: any) {
      if (!isInteractive) return;
      send({ type: "TOGGLE" });
    },

    rootProps: {
      id: dom.getRootId(scope),
      ...sharedData,
      "aria-role": "group",
      "aria-disabled": disabled,
      "aria-invalid": invalid,
    },

    baseProps: {
      id: dom.getBaseId(scope),
      ...sharedData,
      "aria-role": "checkbox",
      "aria-disabled": disabled,
      "aria-invalid": invalid,
      "aria-checked": indeterminate ? "mixed" : checked,
    },

    indicatorProps: {
      ...(indicatorId ? { id: indicatorId } : {}),
      "data-state": dataState,
      "data-disabled": String(disabled),
      "data-checked": String(checked),
      "data-indeterminate": String(indeterminate),
    },

    labelProps: {
      id: dom.getLabelId(scope),
      "data-disabled": String(disabled),
    },

    descriptionProps: {
      ...(descId ? { id: descId } : {}),
      "data-disabled": String(disabled),
    },

    hiddenInputProps: {
      ...(hiddenId ? { id: hiddenId } : {}),
      type: "checkbox",
      name: name || undefined,
      value,
      checked,
      disabled: disabled || readOnly,
      required,
      "aria-hidden": "true",
    },
  };
}
