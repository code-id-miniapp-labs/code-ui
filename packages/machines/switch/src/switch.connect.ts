import type { SwitchApi, SwitchService } from "./switch.types";
import { parts } from "./switch.anatomy";
import * as dom from "./switch.dom";

export function connectSwitch(service: SwitchService): SwitchApi {
  const { state, send, context, computed, scope } = service;

  const currentState = state.get();
  const checked = computed("isChecked");
  const isInteractive = computed("isInteractive");
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const loading = Boolean(context.get("loading"));
  const invalid = Boolean(context.get("invalid"));
  const required = Boolean(context.get("required"));
  const size = computed("effectiveSize");
  const color = context.get("color");
  const name = context.get("name") ?? "";
  const value = context.get("value") ?? "on";

  const baseProps = {
    id: dom.getBaseId(scope),
    ...parts.base.attrs,
    "data-state": currentState,
    "data-checked": String(checked),
    "data-disabled": String(disabled),
    "data-readonly": String(readOnly),
    "data-loading": String(loading),
    "data-invalid": String(invalid),
    role: "switch",
    "aria-checked": checked,
    "aria-disabled": String(disabled),
    "aria-invalid": String(invalid),
  };

  return {
    state: currentState,
    checked,
    isChecked: checked,
    isInteractive,
    disabled,
    readOnly,
    loading,
    invalid,
    required,
    size,
    color,

    setChecked(nextChecked: boolean) {
      send({ type: "SET_CHECKED", checked: nextChecked });
    },

    toggle() {
      send({ type: "TOGGLE" });
    },

    resetChecked() {
      send({ type: "RESET_VALUE" });
    },

    handleTap(_event?: any) {
      send({ type: "TOGGLE" });
    },

    rootProps: {
      id: dom.getRootId(scope),
      ...parts.root.attrs,
      "data-state": currentState,
      "data-checked": String(checked),
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-loading": String(loading),
      "data-invalid": String(invalid),
      role: "group",
      "aria-disabled": String(disabled),
      "aria-invalid": String(invalid),
    },

    containerProps: {
      id: dom.getContainerId(scope),
      ...parts.container.attrs,
      "data-state": currentState,
      "data-disabled": String(disabled),
    },

    baseProps,
    controlProps: baseProps,

    thumbProps: {
      id: dom.getThumbId(scope),
      ...parts.thumb.attrs,
      "data-state": currentState,
      "data-checked": String(checked),
      "data-disabled": String(disabled),
      "data-loading": String(loading),
      "aria-hidden": "true",
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
