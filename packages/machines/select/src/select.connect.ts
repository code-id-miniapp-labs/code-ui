import * as dom from "./select.dom";
import type {
  SelectApi,
  SelectScalarValue,
  SelectService,
  SelectSnapshotItem,
  SelectValue,
} from "./select.types";
import { clampAndSnapPickerIndices, isOptionSelected } from "./select.utils";

export function connectSelect(service: SelectService): SelectApi {
  const { state, send, context, computed, prop, scope } = service;

  const currentState = state.get();
  const open = computed("isOpen");
  const visible = computed("isVisible");
  const value = context.get("value");
  const multiple = Boolean(prop("multiple"));
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const invalid = computed("isInvalid");
  const displayLabel = computed("displayLabel");
  const hasValue = computed("hasValue");
  const isClearable = computed("isClearable");
  const name = prop("name");

  const normalizedItems = computed("normalizedItems");
  let activeItemDomId = "";

  const items: SelectSnapshotItem[] = normalizedItems.map((it, idx) => {
    const domId = dom.getOptionId(scope, idx);
    const selected =
      it.type === "item" && isOptionSelected(it.value, value, multiple);
    if (selected && !activeItemDomId) {
      activeItemDomId = domId;
    }
    return {
      key: it.key,
      domId,
      type: it.type,
      value: it.value,
      label: it.label,
      disabled: it.disabled,
      selected,
      rawIndex: it.rawIndex,
      groupIndex: it.groupIndex,
    };
  });

  const pickerColumns = computed("pickerColumns");
  const rawPending = context.get("pendingIndices");
  const pickerIndices =
    pickerColumns.length > 0
      ? clampAndSnapPickerIndices(pickerColumns, rawPending, rawPending)
      : [];

  const pickerId = dom.getPickerId(scope);
  const hiddenId = dom.getHiddenInputId(scope);

  return {
    state: currentState,
    open,
    visible,
    value,
    displayLabel,
    hasValue,
    isClearable,
    disabled,
    readOnly,
    invalid,
    items,
    pickerColumns,
    pickerIndices,
    activeItemDomId,

    openSelect() {
      send({ type: "OPEN" });
    },

    closeSelect() {
      send({ type: "CLOSE" });
    },

    toggle() {
      send({ type: "TOGGLE" });
    },

    setOpen(nextOpen: boolean) {
      send({ type: nextOpen ? "OPEN" : "CLOSE" });
    },

    setValue(nextVal: SelectValue) {
      send({ type: "SET_VALUE", value: nextVal });
    },

    selectValue(val: SelectScalarValue) {
      send({ type: "SELECT_ITEM", value: val });
    },

    clearValue() {
      send({ type: "CLEAR_VALUE" });
    },

    resetValue() {
      send({ type: "RESET_VALUE" });
    },

    handlePickerChange(indices: number[]) {
      send({ type: "PICKER.CHANGE", indices });
    },

    confirmPicker() {
      send({ type: "PICKER.CONFIRM" });
    },

    cancelPicker(trigger?: string) {
      send({ type: "PICKER.CANCEL", trigger });
    },

    handleBackdropTap() {
      send({ type: "BACKDROP.TAP" });
    },

    rootProps: {
      id: dom.getRootId(scope),
      "data-state": currentState,
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      "aria-disabled": disabled,
      "aria-invalid": invalid,
    },

    triggerProps: {
      id: dom.getTriggerId(scope),
      "data-state": currentState,
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      "aria-role": "combobox",
      "aria-expanded": open,
      "aria-disabled": disabled,
      "aria-invalid": invalid,
      "aria-haspopup": "listbox",
    },

    contentProps: {
      id: dom.getContentId(scope),
      ...(pickerId ? { pickerId } : {}),
      "data-state": currentState,
      "aria-role": "listbox",
      "aria-multiselectable": multiple,
    },

    hiddenInputProps: {
      ...(hiddenId ? { id: hiddenId } : {}),
      type: "text",
      name: name || undefined,
      value: Array.isArray(value) ? JSON.stringify(value) : String(value ?? ""),
      disabled: disabled || readOnly,
      "aria-hidden": "true",
    },
  };
}
