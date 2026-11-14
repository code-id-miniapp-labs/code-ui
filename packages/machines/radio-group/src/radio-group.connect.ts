import type { MiniAppEventLike } from "@code-ui/utils";
import type {
  RadioGroupApi,
  RadioGroupItem,
  RadioGroupItemRaw,
  RadioGroupItemTapDetail,
  RadioGroupService,
} from "./radio-group.types";
import * as dom from "./radio-group.dom";

export function connectRadioGroup(service: RadioGroupService): RadioGroupApi {
  const { send, context, computed, prop, scope } = service;

  const currentValue = context.get("value");
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const invalid = computed("isInvalid");
  const size = computed("effectiveSize");
  const defaultColor = prop("color");
  const defaultVariant = prop("variant");

  const getItemProps = (item: {
    value: string;
    disabled?: boolean | undefined;
  }) => {
    const itemChecked = currentValue === item.value;
    const itemDisabled = Boolean(disabled || item.disabled);
    return {
      id: dom.getItemId(scope, item.value),
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
    const itemChecked = currentValue === item.value;
    const itemDisabled = Boolean(disabled || item.disabled);
    return {
      id: dom.getItemControlId(scope, item.value),
      "data-state": itemChecked ? "checked" : "unchecked",
      "data-disabled": String(itemDisabled),
      "data-checked": String(itemChecked),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      "aria-role": "radio",
      "aria-disabled": itemDisabled,
      "aria-invalid": invalid,
      "aria-checked": itemChecked,
    };
  };

  const getItemIndicatorProps = (item: {
    value: string;
    disabled?: boolean | undefined;
  }) => {
    const itemChecked = currentValue === item.value;
    const itemDisabled = Boolean(disabled || item.disabled);
    return {
      id: dom.getItemIndicatorId(scope, item.value),
      "data-state": itemChecked ? "checked" : "unchecked",
      "data-disabled": String(itemDisabled),
    };
  };

  const rawItems: (string | RadioGroupItemRaw)[] = prop("items");
  const items: RadioGroupItem[] = rawItems.map((raw) => {
    const item = typeof raw === "string" ? { value: raw, label: raw } : raw;
    const itemValue = item.value;
    const itemChecked = currentValue === itemValue;
    const itemDisabled = Boolean(disabled || item.disabled);
    const result: RadioGroupItem = {
      value: itemValue,
      label: String(item.label ?? itemValue),
      description: String(item.description ?? ""),
      disabled: itemDisabled,
      checked: itemChecked,
      color: item.color ?? defaultColor,
      variant: item.variant ?? defaultVariant,
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
    if (item.ui) result.ui = item.ui;
    return result;
  });

  return {
    value: currentValue,
    setValue: (val: string) => {
      send({ type: "SET_VALUE", value: val });
    },
    clear: () => {
      send({ type: "CLEAR" });
    },
    disabled,
    readOnly,
    invalid,
    size,
    items,
    handleItemTap: (e: MiniAppEventLike<RadioGroupItemTapDetail>) => {
      send({ type: "SET_VALUE", value: e.detail.value });
    },
    getItemProps,
    getItemControlProps,
    getItemIndicatorProps,
  };
}
