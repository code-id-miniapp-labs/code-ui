import { getContentId, getListId, getRootId, getTriggerId } from "./tabs.dom";
import type { TabItemComputed, TabsApi, TabsService } from "./tabs.types";

export function connectTabs(service: TabsService): TabsApi {
  const { context, computed, send, scope } = service;

  const value = computed("selectedValue");
  const selectedIndex = computed("selectedIndex");
  const focusedValue = context.get("focusedValue");
  const disabled = computed("isDisabled");
  const normalizedItems = computed("normalizedItems");

  const activeTriggerId = value !== "" ? getTriggerId(scope, value) : "";

  const getRootProps = (): Record<string, any> => ({
    id: getRootId(scope),
    ...(disabled ? { "data-disabled": true } : {}),
  });

  const getListProps = (): Record<string, any> => ({
    id: getListId(scope),
    "aria-role": "tablist",
    "enable-flex": true,
    enhanced: true,
    "show-scrollbar": false,
    "scroll-into-view": activeTriggerId,
  });

  const getTriggerProps = (props: {
    value: string | number;
    index?: number | undefined;
  }): Record<string, any> => {
    const itemValue = props.value;
    const isSelected = itemValue === value;
    const item = normalizedItems.find((it) => it.value === itemValue);
    const itemDisabled = disabled || Boolean(item?.disabled);

    return {
      id: getTriggerId(scope, itemValue),
      "aria-role": "tab",
      "aria-selected": isSelected,
      "aria-controls": getContentId(scope, itemValue),
      ...(itemDisabled ? { "aria-disabled": true } : {}),
      "data-value": itemValue,
      "data-state": isSelected ? "active" : "inactive",
    };
  };

  const getContentProps = (props: {
    value: string | number;
    index?: number | undefined;
  }): Record<string, any> => {
    const itemValue = props.value;
    const isSelected = itemValue === value;

    return {
      id: getContentId(scope, itemValue),
      "aria-role": "tabpanel",
      "aria-labelledby": getTriggerId(scope, itemValue),
      hidden: !isSelected,
      "data-value": itemValue,
      "data-state": isSelected ? "active" : "inactive",
    };
  };

  const items: TabItemComputed[] = normalizedItems.map((item, index) => {
    const isSelected = item.value === value;
    const itemDisabled = disabled || Boolean(item.disabled);

    return {
      index,
      value: item.value,
      disabled: itemDisabled,
      isSelected,
      triggerProps: getTriggerProps({ value: item.value, index }),
      contentProps: getContentProps({ value: item.value, index }),
    };
  });

  return {
    value,
    selectedIndex,
    focusedValue,
    disabled,
    items,
    activeTriggerId,

    setValue: (val) => send({ type: "SET_VALUE", value: val }),
    select: (val) => send({ type: "SELECT", value: val }),
    setFocus: (val) => send({ type: "FOCUS", value: val }),
    clearFocus: () => send({ type: "BLUR" }),
    selectNext: () => send({ type: "NEXT" }),
    selectPrev: () => send({ type: "PREV" }),
    selectFirst: () => send({ type: "FIRST" }),
    selectLast: () => send({ type: "LAST" }),

    getRootProps,
    getListProps,
    getTriggerProps,
    getContentProps,

    rootProps: getRootProps(),
    listProps: getListProps(),
  };
}
