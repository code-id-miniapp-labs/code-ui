import type {
  CheckboxApi,
  CheckboxService,
} from "./checkbox.types";
import { parts } from "./checkbox.anatomy";
import * as dom from "./checkbox.dom";

export function connectCheckbox(service: CheckboxService): CheckboxApi {
  const { state, send, context, computed, scope } = service;

  const currentState = state.get();
  const checked = computed("isChecked");
  const indeterminate = computed("isIndeterminate");
  const isInteractive = computed("isInteractive");
  const disabled = computed("isDisabled");
  const readOnly = Boolean(
    context.get("readOnly") || context.get("formReadOnly"),
  );
  const invalid = computed("isInvalid");
  const required = Boolean(context.get("required"));

  const size = computed("effectiveSize");
  const color = computed("effectiveColor");
  const name = context.get("name") ?? "";
  const value = context.get("value") ?? "";
  const label = context.get("label") ?? "";
  const description = context.get("description") ?? "";
  const icon = context.get("icon") ?? "check";
  const indeterminateIcon = context.get("indeterminateIcon") ?? "minus";

  const dataState = indeterminate
    ? "indeterminate"
    : checked
      ? "checked"
      : "unchecked";

  const baseProps = {
    id: dom.getBaseId(scope),
    ...parts.base.attrs,
    "data-state": dataState,
    "data-checked": String(checked),
    "data-indeterminate": String(indeterminate),
    "data-disabled": String(disabled),
    "data-readonly": String(readOnly),
    "data-invalid": String(invalid),
    role: "checkbox",
    "aria-checked": indeterminate ? "mixed" : checked,
    "aria-disabled": String(disabled),
    "aria-invalid": String(invalid),
  };

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
      ...parts.root.attrs,
      "data-state": dataState,
      "data-checked": String(checked),
      "data-indeterminate": String(indeterminate),
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      role: "group",
      "aria-disabled": String(disabled),
      "aria-invalid": String(invalid),
    },

    baseProps,

    indicatorProps: {
      id: dom.getIndicatorId(scope),
      ...parts.indicator.attrs,
      "data-state": dataState,
      "data-checked": String(checked),
      "data-indeterminate": String(indeterminate),
      "data-disabled": String(disabled),
    },

    labelProps: {
      id: dom.getLabelId(scope),
      ...parts.label.attrs,
      "data-disabled": String(disabled),
    },

    descriptionProps: {
      id: dom.getDescriptionId(scope),
      ...parts.description.attrs,
      "data-disabled": String(disabled),
    },

    hiddenInputProps: {
      id: dom.getHiddenInputId(scope),
      type: "checkbox",
      tabIndex: -1,
      name: name || undefined,
      value,
      checked,
      disabled: disabled || readOnly,
      required,
      "aria-hidden": "true",
    },
  };
}
