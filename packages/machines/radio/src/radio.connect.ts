import type { RadioApi, RadioService } from "./radio.types";
import * as dom from "./radio.dom";

export function connectRadio(service: RadioService): RadioApi {
  const { send, computed, prop, scope } = service;

  const checked = computed("isChecked");
  const disabled = computed("isDisabled");
  const readOnly = Boolean(prop("readOnly"));
  const invalid = computed("isInvalid");
  const size = computed("effectiveSize");
  const color = computed("effectiveColor");
  const variant = computed("effectiveVariant");
  const value = prop("value") ?? "";
  const label = prop("label") ?? "";
  const description = prop("description") ?? "";
  const dataState = checked ? "checked" : "unchecked";
  const indicatorId = dom.getIndicatorId(scope);

  return {
    checked,
    disabled,
    readOnly,
    invalid,
    size,
    color,
    variant,
    value,
    label,
    description,
    handleTap: () => {
      send({ type: "SELECT" });
    },
    rootProps: {
      id: dom.getRootId(scope),
      "data-state": dataState,
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
    },
    baseProps: {
      id: dom.getBaseId(scope),
      "data-state": dataState,
      "data-disabled": String(disabled),
      "data-checked": String(checked),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      "aria-role": "radio",
      "aria-disabled": disabled,
      "aria-invalid": invalid,
      "aria-checked": checked,
    },
    indicatorProps: {
      ...(indicatorId ? { id: indicatorId } : {}),
      "data-state": dataState,
      "data-disabled": String(disabled),
    },
  };
}
