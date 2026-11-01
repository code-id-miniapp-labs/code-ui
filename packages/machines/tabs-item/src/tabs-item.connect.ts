import { getContentId, getRootId } from "./tabs-item.dom";
import type { TabsItemApi, TabsItemService } from "./tabs-item.types";

export function connectTabsItem(service: TabsItemService): TabsItemApi {
  const { context, computed, send, scope } = service;

  const value = computed("resolvedValue");
  const label = context.get("label");
  const isSelected = computed("isSelected");
  const isDisabled = computed("isDisabled");
  const lazy = Boolean(context.get("lazy"));

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
    "aria-labelledby": `cui-tabs-${context.get("tabsId") ?? "root"}-trigger-${value}`,
    "data-scope": "tabs-item",
    "data-part": "content",
    "data-value": value,
    "data-state": isSelected ? "active" : "inactive",
    hidden: !isSelected,
  });

  const rootProps = getRootProps();
  const contentProps = getContentProps();

  return {
    value,
    label,
    isSelected,
    isDisabled,
    lazy,

    select() {
      send({ type: "SELECT" });
    },

    getRootProps,
    getContentProps,

    rootProps,
    contentProps,
  };
}
