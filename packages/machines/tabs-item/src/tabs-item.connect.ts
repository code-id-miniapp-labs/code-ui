import { getContentId, getRootId, getTriggerId } from "./tabs-item.dom";
import type {
  TabsItemApi,
  TabsItemService,
} from "./tabs-item.types";

export function connectTabsItem(service: TabsItemService): TabsItemApi {
  const { prop, computed, send, scope } = service;

  const value = computed("resolvedValue");
  const label = prop("label") ?? "";
  const isSelected = computed("isSelected");
  const isDisabled = computed("isDisabled");
  const lazy = Boolean(prop("lazy"));
  const tabsId = prop("tabsId");
  const orientation =
    prop("orientation") ?? prop("groupOrientation") ?? "horizontal";
  const variant =
    prop("variant") ?? prop("groupVariant") ?? "pill";
  const color =
    prop("color") ?? prop("groupColor") ?? "primary";
  const size =
    prop("size") ?? prop("groupSize") ?? "md";
  const fitted = Boolean(
    prop("fitted") ?? prop("groupFitted") ?? false,
  );
  const index =
    prop("index") ?? prop("groupIndex") ?? 0;
  const mode = prop("mode") ?? "auto";
  const icon = prop("icon");
  const trailingIcon = prop("trailingIcon");

  const getRootProps = (): Record<string, any> => ({
    id: getRootId(scope, value),
    "data-scope": "tabs-item",
    "data-part": "root",
    "data-value": value,
    "data-state": isSelected ? "active" : "inactive",
    "data-disabled": isDisabled,
    hidden: !isSelected,
  });

  const getContentProps = (): Record<string, any> => ({
    id: getContentId(scope, value),
    role: "tabpanel",
    "aria-labelledby": getTriggerId(scope, tabsId, value),
    "data-scope": "tabs-item",
    "data-part": "content",
    "data-value": value,
    "data-state": isSelected ? "active" : "inactive",
    hidden: !isSelected,
  });

  const customTriggerId = prop("triggerId");
  const getTriggerProps = (): Record<string, any> => ({
    id:
      customTriggerId && customTriggerId !== ""
        ? customTriggerId
        : getTriggerId(scope, tabsId, value),
    role: "tab",
    tabindex: isSelected ? 0 : -1,
    "aria-selected": isSelected,
    "aria-disabled": isDisabled,
    "aria-controls": getContentId(scope, value),
    "data-scope": "tabs",
    "data-part": "trigger",
    "data-value": value,
    "data-index": index,
    "data-state": isSelected ? "active" : "inactive",
    "data-disabled": isDisabled,
    "data-orientation": orientation,
  });

  const rootProps = getRootProps();
  const contentProps = getContentProps();
  const triggerProps = getTriggerProps();

  return {
    value,
    label,
    icon,
    trailingIcon,
    isSelected,
    isDisabled,
    lazy,
    mode,
    orientation,
    variant,
    color,
    size,
    fitted,
    index,

    select() {
      send({ type: "SELECT" });
    },

    getRootProps,
    getContentProps,
    getTriggerProps,

    rootProps,
    contentProps,
    triggerProps,
  };
}
