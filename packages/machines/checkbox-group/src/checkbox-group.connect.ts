import type {
  CheckboxGroupApi,
  CheckboxGroupItem,
  CheckboxGroupItemRaw,
  CheckboxGroupService,
  CheckboxGroupSize,
} from "./checkbox-group.types";
import { parts } from "./checkbox-group.anatomy";
import * as dom from "./checkbox-group.dom";

export function connectCheckboxGroup(
  service: CheckboxGroupService,
): CheckboxGroupApi {
  const { send, context, computed, scope, refs } = service;

  const currentValue: string[] = context.get("value") ?? [];
  const isInteractive = computed("isInteractive");
  const disabled = Boolean(
    context.get("disabled") ||
      context.get("formDisabled") ||
      context.get("fieldDisabled"),
  );
  const readOnly = Boolean(
    context.get("readOnly") || context.get("formReadOnly"),
  );
  const invalid = Boolean(context.get("invalid"));
  const required = Boolean(context.get("required"));

  const rawSize = context.get("size");
  const fieldSize = context.get("fieldSize");
  const size =
    rawSize && rawSize !== "md"
      ? rawSize
      : ((fieldSize || rawSize || "md") as CheckboxGroupSize);

  const color = context.get("color");
  const orientation = context.get("orientation");
  const variant = context.get("variant");
  const legend = context.get("legend") ?? "";

  const getItemProps = (item: {
    value: string;
    disabled?: boolean | undefined;
  }) => {
    const itemChecked = currentValue.includes(item.value);
    const itemDisabled = Boolean(disabled || item.disabled);
    return {
      id: dom.getItemId(scope, item.value),
      ...parts.item.attrs,
      "data-state": itemChecked ? "checked" : "unchecked",
      "data-disabled": String(itemDisabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
    };
  };

  const getItemControlProps = (item: {
    value: string;
    disabled?: boolean | undefined;
  }) => {
    const itemChecked = currentValue.includes(item.value);
    const itemDisabled = Boolean(disabled || item.disabled);
    return {
      id: dom.getItemControlId(scope, item.value),
      ...parts.base.attrs,
      "data-state": itemChecked ? "checked" : "unchecked",
      "data-checked": String(itemChecked),
      "data-disabled": String(itemDisabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      role: "checkbox",
      "aria-checked": itemChecked,
      "aria-disabled": String(itemDisabled),
      "aria-invalid": String(invalid),
    };
  };

  const getItemIndicatorProps = (item: {
    value: string;
    disabled?: boolean | undefined;
  }) => {
    const itemChecked = currentValue.includes(item.value);
    const itemDisabled = Boolean(disabled || item.disabled);
    return {
      id: dom.getItemIndicatorId(scope, item.value),
      ...parts.indicator.attrs,
      "data-state": itemChecked ? "checked" : "unchecked",
      "data-disabled": String(itemDisabled),
    };
  };

  const rawItems: (string | CheckboxGroupItemRaw)[] =
    context.get("items") ?? [];
  const items: CheckboxGroupItem[] = rawItems.map((raw) => {
    const item = typeof raw === "string" ? { value: raw, label: raw } : raw;
    const itemValue = String(item.value ?? "");
    const itemChecked = currentValue.includes(itemValue);
    const itemDisabled = Boolean(disabled || item.disabled);
    const result: CheckboxGroupItem = {
      value: itemValue,
      label: String(item.label ?? itemValue),
      description: String(item.description ?? ""),
      disabled: itemDisabled,
      checked: itemChecked,
      itemProps: getItemProps({ value: itemValue, disabled: itemDisabled }),
      controlProps: getItemControlProps({
        value: itemValue,
        disabled: itemDisabled,
      }),
      indicatorProps: getItemIndicatorProps({
        value: itemValue,
        disabled: itemDisabled,
      }),
    };
    if (item.color) result.color = item.color;
    if (item.variant) result.variant = item.variant;
    if (item.ui) result.ui = item.ui;
    return result;
  });

  return {
    value: currentValue,
    setValue: (val: string[]) => {
      send({ type: "SET_VALUE", value: val });
    },
    toggleValue: (val: string) => {
      send({ type: "TOGGLE_VALUE", value: val });
    },
    selectAll: () => {
      send({ type: "SELECT_ALL" });
    },
    clear: () => {
      send({ type: "CLEAR" });
    },
    isInteractive,
    disabled,
    readOnly,
    required,
    invalid,
    size,
    color,
    orientation,
    variant,
    legend,
    items,
    handleItemTap: (e?: any) => {
      const raw = e?.currentTarget?.dataset?.value ?? e?.detail?.value;
      if (
        raw !== undefined &&
        raw !== null &&
        typeof raw !== "boolean" &&
        raw !== ""
      ) {
        const checked =
          typeof e?.detail?.checked === "boolean"
            ? e.detail.checked
            : undefined;
        send({
          type: "TOGGLE_VALUE",
          value: String(raw),
          ...(checked !== undefined ? { checked } : {}),
        });
      }
    },
    getItemProps,
    getItemControlProps,
    getItemIndicatorProps,
    formField: refs?.get?.("formField"),
  };
}
