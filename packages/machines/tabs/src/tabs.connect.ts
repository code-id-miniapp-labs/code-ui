import {
  getContentId,
  getIndicatorId,
  getListId,
  getRootId,
  getTriggerId,
} from "./tabs.dom";
import type {
  TabItemComputed,
  TabsApi,
  TabsColor,
  TabsOrientation,
  TabsService,
  TabsSize,
  TabsVariant,
} from "./tabs.types";

export function connectTabs(service: TabsService): TabsApi {
  const { context, computed, send, scope, prop } = service;

  const value = computed("selectedValue");
  const selectedIndex = computed("selectedIndex");
  const totalCount = computed("totalCount");
  const focusedValue = context.get("focusedValue");
  const orientation = (prop("orientation") ?? "horizontal") as TabsOrientation;
  const variant = (prop("variant") ?? "pill") as TabsVariant;
  const color = (prop("color") ?? "primary") as TabsColor;
  const size = (prop("size") ?? "md") as TabsSize;
  const disabled = computed("isDisabled");
  const normalizedItems = computed("normalizedItems");
  const selectedItem = computed("selectedItem");
  const scrollLeft = context.get("scrollLeft");
  const canScrollLeft = context.get("canScrollLeft") ?? false;
  const canScrollRight = context.get("canScrollRight") ?? false;
  const fitted = Boolean(prop("fitted"));

  let scrollMaskStyle = "";
  if (!fitted && orientation === "horizontal") {
    if (canScrollLeft && canScrollRight) {
      scrollMaskStyle =
        "-webkit-mask-image: linear-gradient(to right, transparent 0%, #000 24px, #000 calc(100% - 24px), transparent 100%); mask-image: linear-gradient(to right, transparent 0%, #000 24px, #000 calc(100% - 24px), transparent 100%);";
    } else if (canScrollLeft) {
      scrollMaskStyle =
        "-webkit-mask-image: linear-gradient(to right, transparent 0%, #000 24px, #000 100%); mask-image: linear-gradient(to right, transparent 0%, #000 24px, #000 100%);";
    } else if (canScrollRight) {
      scrollMaskStyle =
        "-webkit-mask-image: linear-gradient(to right, #000 0%, #000 calc(100% - 24px), transparent 100%); mask-image: linear-gradient(to right, #000 0%, #000 calc(100% - 24px), transparent 100%);";
    }
  }
  const activeTriggerId =
    value !== undefined && value !== null && value !== ""
      ? getTriggerId(scope, value)
      : undefined;
  const indicatorStyle =
    orientation === "horizontal" && totalCount > 0 && selectedIndex >= 0
      ? `width: calc(100% / ${totalCount}); transform: translate3d(calc(100% * ${selectedIndex}), 0, 0);`
      : "";

  const getRootProps = (): Record<string, any> => ({
    id: getRootId(scope),
    "data-scope": "tabs",
    "data-part": "root",
    "data-orientation": orientation,
    "data-disabled": disabled,
  });

  const getListProps = (): Record<string, any> => ({
    id: getListId(scope),
    role: "tablist",
    "aria-orientation": orientation,
    "data-scope": "tabs",
    "data-part": "list",
    "data-orientation": orientation,
    "scroll-x": orientation === "horizontal",
    "scroll-y": orientation === "vertical",
    scrollX: orientation === "horizontal",
    scrollY: orientation === "vertical",
    "enable-flex": true,
    enableFlex: true,
    enhanced: true,
    "show-scrollbar": false,
    "scroll-into-view": activeTriggerId,
    "scroll-left": scrollLeft,
    scrollLeft,
  });

  const getIndicatorProps = (): Record<string, any> => ({
    id: getIndicatorId(scope),
    "data-scope": "tabs",
    "data-part": "indicator",
    "data-orientation": orientation,
    "data-state": "active",
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
      role: "tab",
      tabindex: isSelected ? 0 : -1,
      "aria-selected": isSelected,
      "aria-disabled": itemDisabled,
      "aria-controls": getContentId(scope, itemValue),
      "data-scope": "tabs",
      "data-part": "trigger",
      "data-value": itemValue,
      "data-state": isSelected ? "active" : "inactive",
      "data-disabled": itemDisabled,
      "data-orientation": orientation,
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
      role: "tabpanel",
      "aria-labelledby": getTriggerId(scope, itemValue),
      hidden: !isSelected,
      tabindex: 0,
      "data-scope": "tabs",
      "data-part": "content",
      "data-value": itemValue,
      "data-state": isSelected ? "active" : "inactive",
      "data-orientation": orientation,
    };
  };

  const items: TabItemComputed[] = normalizedItems.map((item, index) => {
    const isSelected = item.value === value;
    const itemDisabled = disabled || Boolean(item.disabled);

    return Object.assign({}, item, {
      index,
      value: item.value,
      label: item.label,
      icon: item.icon,
      trailingIcon: item.trailingIcon,
      disabled: itemDisabled,
      isSelected,
      content: item.content,
      slot: item.slot,
      ui: item.ui,
      triggerProps: getTriggerProps({ value: item.value, index }),
      contentProps: getContentProps({ value: item.value, index }),
    });
  });

  const rootProps = getRootProps();
  const listProps = getListProps();
  const indicatorProps = getIndicatorProps();

  return {
    value,
    selectedIndex,
    focusedValue,
    orientation,
    variant,
    color,
    size,
    disabled,
    items,
    selectedItem,
    activeTriggerId,
    scrollLeft,
    canScrollLeft,
    canScrollRight,
    scrollMaskStyle,
    fitted,
    totalCount,
    indicatorStyle,

    setValue(val) {
      send({ type: "SET_VALUE", value: val });
    },
    select(val) {
      send({ type: "SELECT", value: val });
    },
    setFocus(val) {
      send({ type: "FOCUS", value: val });
    },
    clearFocus() {
      send({ type: "BLUR" });
    },
    selectNext() {
      send({ type: "NEXT" });
    },
    selectPrev() {
      send({ type: "PREV" });
    },
    selectFirst() {
      send({ type: "FIRST" });
    },
    selectLast() {
      send({ type: "LAST" });
    },

    getRootProps,
    getListProps,
    getTriggerProps,
    getContentProps,
    getIndicatorProps,

    rootProps,
    listProps,
    indicatorProps,
  };
}
