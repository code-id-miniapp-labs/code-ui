import type { CheckboxApi, CheckboxService } from "./checkbox.types";
import * as dom from "./checkbox.dom";

export function connectCheckbox(service: CheckboxService): CheckboxApi {
  const { state, send, computed, scope } = service;

  const currentState = state.get();
  const checked = computed("isChecked");
  const indeterminate = computed("isIndeterminate");
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const invalid = computed("isInvalid");

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

  return {
    state: currentState,
    checked,
    indeterminate,
    disabled,
    readOnly,
    invalid,

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

    handleTap() {
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
  };
}
