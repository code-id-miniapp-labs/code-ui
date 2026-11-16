import * as dom from "./input-menu.dom";
import type {
  InputMenuApi,
  InputMenuScalarValue,
  InputMenuService,
  InputMenuSnapshotItem,
  InputMenuValue,
} from "./input-menu.types";
import { isOptionSelected } from "./input-menu.utils";

export function connectInputMenu(service: InputMenuService): InputMenuApi {
  const { state, send, context, computed, prop, scope } = service;

  const currentState = state.get();
  const open = computed("isOpen");
  const visible = computed("isVisible");
  const focused = context.get("focused");
  const value = context.get("value");
  const searchTerm = context.get("searchTerm");
  const inputValue = computed("inputValue");
  const multiple = Boolean(prop("multiple"));
  const disabled = computed("isDisabled");
  const readOnly = computed("isReadOnly");
  const invalid = computed("isInvalid");
  const displayLabel = computed("displayLabel");
  const hasValue = computed("hasValue");
  const isClearable = computed("isClearable");
  const showCreateItem = computed("showCreateItem");
  const createItemPosition = computed("createItemPosition");
  const name = prop("name");

  const filteredItems = computed("filteredItems");
  let activeItemDomId = "";

  const items: InputMenuSnapshotItem[] = filteredItems.map((it, idx) => {
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

  const tags = computed("selectedTags");
  const hiddenId = dom.getHiddenInputId(scope);

  return {
    state: currentState,
    open,
    visible,
    focused,
    value,
    searchTerm,
    inputValue,
    displayLabel,
    hasValue,
    isClearable,
    disabled,
    readOnly,
    invalid,
    items,
    tags,
    activeItemDomId,
    showCreateItem,
    createItemPosition,

    openInputMenu() {
      send({ type: "OPEN" });
    },

    closeInputMenu() {
      send({ type: "CLOSE" });
    },

    toggle() {
      send({ type: "TOGGLE" });
    },

    handleTriggerTap() {
      send({ type: "TRIGGER.TAP" });
    },

    handleFocus() {
      send({ type: "FOCUS" });
    },

    handleBlur() {
      send({ type: "BLUR" });
    },

    handleInput(nextSearch: string) {
      send({ type: "INPUT", value: nextSearch });
    },

    handleConfirm(raw?: string) {
      send({ type: "CONFIRM", value: raw });
    },

    setOpen(nextOpen: boolean) {
      send({ type: nextOpen ? "OPEN" : "CLOSE" });
    },

    setValue(nextVal: InputMenuValue) {
      send({ type: "SET_VALUE", value: nextVal });
    },

    setSearchTerm(nextSearch: string) {
      send({ type: "SET_SEARCH_TERM", searchTerm: nextSearch });
    },

    selectValue(val: InputMenuScalarValue) {
      send({ type: "SELECT_ITEM", value: val });
    },

    removeTag(val: InputMenuScalarValue) {
      send({ type: "REMOVE_TAG", value: val });
    },

    createItem() {
      send({ type: "CREATE_ITEM" });
    },

    clearValue() {
      send({ type: "CLEAR_VALUE" });
    },

    resetValue() {
      send({ type: "RESET_VALUE" });
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
      "data-focused": String(focused),
      "data-disabled": String(disabled),
      "data-readonly": String(readOnly),
      "data-invalid": String(invalid),
      "aria-role": "combobox",
      "aria-expanded": open,
      "aria-disabled": disabled,
      "aria-invalid": invalid,
      "aria-haspopup": "listbox",
    },

    inputProps: {
      id: dom.getInputId(scope),
      value: inputValue,
      focus: focused,
      disabled: disabled || readOnly,
      "aria-invalid": invalid,
    },

    contentProps: {
      id: dom.getContentId(scope),
      "data-state": currentState,
      "aria-role": "listbox",
      "aria-multiselectable": multiple,
    },

    hiddenInputProps: {
      ...(hiddenId ? { id: hiddenId } : {}),
      type: "text",
      name: name || undefined,
      value: Array.isArray(value)
        ? JSON.stringify(value)
        : String(value ?? ""),
      disabled: disabled || readOnly,
      "aria-hidden": "true",
    },
  };
}
