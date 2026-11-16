import { getContentId, getTriggerId } from "./tabs-item.dom";
import type { TabsItemApi, TabsItemService } from "./tabs-item.types";

export function connectTabsItem(service: TabsItemService): TabsItemApi {
  const { prop, computed, send, scope, state } = service;

  const value = computed("resolvedValue");
  const isSelected = computed("isSelected");
  const disabled = computed("isDisabled");
  const tabsId = prop("tabsId");
  const index = computed("index");
  const stateValue = state.get();
  const stateAttr = isSelected ? "active" : "inactive";

  const getContentProps = (): Record<string, any> => ({
    id: getContentId(scope, value),
    "aria-role": "tabpanel",
    "aria-labelledby": getTriggerId(scope, tabsId, value),
    "data-value": value,
    "data-state": stateAttr,
    hidden: !isSelected,
  });

  const customTriggerId = prop("triggerId");
  const getTriggerProps = (): Record<string, any> => ({
    id:
      customTriggerId !== ""
        ? customTriggerId
        : getTriggerId(scope, tabsId, value),
    "data-value": value,
    "data-index": index,
  });

  return {
    state: stateValue,
    value,
    isSelected,
    disabled,
    index,

    select: () => send({ type: "SELECT" }),

    getContentProps,
    getTriggerProps,

    contentProps: getContentProps(),
    triggerProps: getTriggerProps(),
  };
}
