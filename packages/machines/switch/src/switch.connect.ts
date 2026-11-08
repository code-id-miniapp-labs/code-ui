import type { SwitchApi, SwitchService } from "./switch.types";
import * as dom from "./switch.dom";

export function connectSwitch(service: SwitchService): SwitchApi {
  const { state, send, computed, prop, scope } = service;

  const currentState = state.get();
  const checked = computed("isChecked");
  const isInteractive = computed("isInteractive");
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const loading = Boolean(prop("loading"));
  const invalid = computed("isInvalid");
  const required = Boolean(prop("required"));
  const size = computed("effectiveSize");
  const color = prop("color") ?? "primary";
  const name = prop("name") ?? "";
  const value = prop("value") ?? "on";

  const sharedData = {
    "data-state": currentState,
    "data-disabled": String(disabled),
    "data-checked": String(checked),
    "data-readonly": String(readOnly),
    "data-loading": String(loading),
    "data-invalid": String(invalid),
  };
  const containerId = dom.getContainerId(scope);
  const thumbId = dom.getThumbId(scope);
  const descId = dom.getDescriptionId(scope);
  const hiddenId = dom.getHiddenInputId(scope);

  const baseProps = {
    id: dom.getBaseId(scope),
    ...sharedData,
    "aria-role": "switch",
    "aria-disabled": disabled,
    "aria-invalid": invalid,
    "aria-checked": checked,
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
      ...sharedData,
      "aria-role": "group",
      "aria-disabled": disabled,
      "aria-invalid": invalid,
    },

    containerProps: {
      ...(containerId ? { id: containerId } : {}),
      "data-state": currentState,
      "data-disabled": String(disabled),
    },

    baseProps,
    controlProps: baseProps,

    thumbProps: {
      ...(thumbId ? { id: thumbId } : {}),
      "data-state": currentState,
      "data-disabled": String(disabled),
      "data-checked": String(checked),
      "data-loading": String(loading),
      "aria-hidden": "true",
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
