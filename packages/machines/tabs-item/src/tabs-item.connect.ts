import { getContentId, getRootId, getTriggerId } from "./tabs-item.dom";
import type { TabsItemApi, TabsItemService } from "./tabs-item.types";

export function connectTabsItem(service: TabsItemService): TabsItemApi {
  const { prop, computed, send, scope } = service;

  const value = computed("resolvedValue");
  const label = prop("label") ?? "";
  const isSelected = computed("isSelected");
  const isDisabled = computed("isDisabled");
  const lazy = Boolean(prop("lazy"));
  const tabsId = prop("tabsId");
  const orientation = computed("orientation");
  const variant = computed("variant");
  const color = computed("color");
  const size = computed("size");
  const fitted = computed("fitted");
  const index = computed("index");
  const mode = prop("mode") ?? "auto";
  const icon = prop("icon");
  const trailingIcon = prop("trailingIcon");

  const getRootProps = (): Record<string, any> => ({
    id: getRootId(scope, value),
    "data-value": value,
    hidden: !isSelected,
  });

  const getContentProps = (): Record<string, any> => ({
    id: getContentId(scope, value),
    "aria-role": "tabpanel",
    "aria-labelledby": getTriggerId(scope, tabsId, value),
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
    "data-value": value,
    "data-index": index,
  });

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

    select: () => send({ type: "SELECT" }),

    getRootProps,
    getContentProps,
    getTriggerProps,

    rootProps: getRootProps(),
    contentProps: getContentProps(),
    triggerProps: getTriggerProps(),
  };
}
