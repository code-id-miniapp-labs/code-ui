import type { RadioApi, RadioService } from "./radio.types";
import { radioParts } from "./radio.anatomy";
import * as dom from "./radio.dom";

export function connectRadio(service: RadioService): RadioApi {
  const { send, context, computed, scope } = service;

  const checked = computed("isChecked");
  const disabled = computed("isDisabled");
  const readOnly = Boolean(context.get("readOnly"));
  const invalid = computed("isInvalid");
  const size = computed("effectiveSize");
  const color = computed("effectiveColor");
  const variant = computed("effectiveVariant");
  const value = context.get("value") ?? "";
  const label = context.get("label") ?? "";
  const description = context.get("description") ?? "";

  const rootProps = {
    id: dom.getRootId(scope),
    ...radioParts.root.attrs,
    "data-state": checked ? "checked" : "unchecked",
    "data-disabled": String(disabled),
    "data-readonly": String(readOnly),
    "data-invalid": String(invalid),
  };

  const baseProps = {
    id: dom.getBaseId(scope),
    ...radioParts.base.attrs,
    "data-state": checked ? "checked" : "unchecked",
    "data-checked": String(checked),
    "data-disabled": String(disabled),
    "data-readonly": String(readOnly),
    "data-invalid": String(invalid),
    role: "radio",
    "aria-checked": checked,
    "aria-disabled": String(disabled),
    "aria-invalid": String(invalid),
  };

  const indicatorProps = {
    id: dom.getIndicatorId(scope),
    ...radioParts.indicator.attrs,
    "data-state": checked ? "checked" : "unchecked",
    "data-disabled": String(disabled),
  };

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
    rootProps,
    baseProps,
    indicatorProps,
  };
}
