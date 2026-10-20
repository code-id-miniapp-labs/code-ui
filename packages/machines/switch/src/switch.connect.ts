import type { SwitchApi, SwitchService, SwitchSize } from "./switch.types";
import { parts } from "./switch.anatomy";
import * as dom from "./switch.dom";

export function connectSwitch(service: SwitchService): SwitchApi {
  const { state, send, context, computed, scope } = service;

  const currentState = state.get();
  const checked = computed("isChecked");
  const isInteractive = computed("isInteractive");
  const disabled = Boolean(
    context.get("disabled") ||
    context.get("formDisabled") ||
    context.get("fieldDisabled"),
  );
  const readOnly = Boolean(
    context.get("readOnly") || context.get("formReadOnly"),
  );
  const loading = Boolean(context.get("loading"));
  const invalid = Boolean(context.get("invalid"));
  const required = Boolean(context.get("required"));

  const rawSize = context.get("size");
  const fieldSize = context.get("fieldSize");
  const size =
    rawSize && rawSize !== "md"
      ? rawSize
      : ((fieldSize || rawSize || "md") as SwitchSize);
  const color = context.get("color");
  const name = context.get("name") ?? "";
  const value = context.get("value") ?? "on";

  const baseProps = {
    id: dom.getBaseId(scope),
    ...parts.base.attrs,
    "data-state": currentState,
    "data-checked": checked ? "true" : "false",
    "data-disabled": disabled ? "true" : "false",
    "data-readonly": readOnly ? "true" : "false",
    "data-loading": loading ? "true" : "false",
    "data-invalid": invalid ? "true" : "false",
    role: "switch",
    "aria-checked": checked,
    "aria-disabled": disabled ? "true" : "false",
    "aria-invalid": invalid ? "true" : "false",
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
      "data-checked": checked ? "true" : "false",
      "data-disabled": disabled ? "true" : "false",
      "data-readonly": readOnly ? "true" : "false",
      "data-loading": loading ? "true" : "false",
      "data-invalid": invalid ? "true" : "false",
      role: "group",
      "aria-disabled": disabled ? "true" : "false",
      "aria-invalid": invalid ? "true" : "false",
    },

    containerProps: {
      id: dom.getContainerId(scope),
      ...parts.container.attrs,
      "data-state": currentState,
      "data-disabled": disabled ? "true" : "false",
    },

    baseProps,
    controlProps: baseProps,

    thumbProps: {
      id: dom.getThumbId(scope),
      ...parts.thumb.attrs,
      "data-state": currentState,
      "data-checked": checked ? "true" : "false",
      "data-disabled": disabled ? "true" : "false",
      "data-loading": loading ? "true" : "false",
      "aria-hidden": "true",
    },

    labelProps: {
      id: dom.getLabelId(scope),
      ...parts.label.attrs,
      "data-disabled": disabled ? "true" : "false",
    },

    descriptionProps: {
      id: dom.getDescriptionId(scope),
      ...parts.description.attrs,
      "data-disabled": disabled ? "true" : "false",
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
