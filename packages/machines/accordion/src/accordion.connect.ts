import {
  getContentId,
  getItemId,
  getRootId,
  getTriggerId,
} from "./accordion.dom";
import type {
  AccordionApi,
  AccordionItemSnapshot,
  AccordionService,
} from "./accordion.types";

export function connectAccordion(service: AccordionService): AccordionApi {
  const { context, computed, prop, send, scope } = service;

  const value = context.get("value");
  const disabled = computed("isDisabled");
  const rawItems = prop("items");
  const hasItems = rawItems.length > 0;

  const isOpen = (val: string | number): boolean => value.includes(String(val));

  const getItemState = (val: string | number) => {
    const valStr = String(val);
    const item = hasItems
      ? rawItems.find((it, idx) => String(it.value ?? idx) === valStr)
      : undefined;
    return {
      isOpen: value.includes(valStr),
      disabled: disabled || Boolean(item?.disabled),
    };
  };

  const rootProps: Record<string, any> = {
    id: getRootId(scope),
    "data-disabled": String(disabled),
  };

  const buildItemProps = (val: string, open: boolean, itemDisabled: boolean) => ({
    id: getItemId(scope, val),
    "data-value": val,
    "data-state": open ? "open" : "closed",
    "data-disabled": String(itemDisabled),
  });

  const buildTriggerProps = (
    val: string,
    open: boolean,
    itemDisabled: boolean,
  ) => ({
    id: getTriggerId(scope, val),
    "aria-role": "button",
    "aria-disabled": itemDisabled,
    "aria-expanded": open,
    "data-value": val,
    "data-state": open ? "open" : "closed",
    "data-disabled": String(itemDisabled),
  });

  const buildContentProps = (val: string, open: boolean) => ({
    id: getContentId(scope, val),
    "aria-role": "region",
    "aria-labelledby": getTriggerId(scope, val),
    hidden: !open,
    "data-value": val,
    "data-state": open ? "open" : "closed",
  });

  const getItemProps = (props: {
    value: string | number;
    index?: number;
  }): Record<string, any> => {
    const val = String(props.value);
    const st = getItemState(val);
    return buildItemProps(val, st.isOpen, st.disabled);
  };

  const getTriggerProps = (props: {
    value: string | number;
    index?: number;
  }): Record<string, any> => {
    const val = String(props.value);
    const st = getItemState(val);
    return buildTriggerProps(val, st.isOpen, st.disabled);
  };

  const getContentProps = (props: {
    value: string | number;
    index?: number;
  }): Record<string, any> => {
    const val = String(props.value);
    return buildContentProps(val, isOpen(val));
  };

  const computedItems: AccordionItemSnapshot[] = hasItems
    ? rawItems.map((item, index) => {
        const valStr = String(item.value ?? index);
        const open = isOpen(valStr);
        const isItemDisabled = disabled || Boolean(item.disabled);

        return {
          index,
          value: valStr,
          isOpen: open,
          disabled: isItemDisabled,
          itemProps: buildItemProps(valStr, open, isItemDisabled),
        };
      })
    : [];

  return {
    value,
    disabled,
    items: computedItems,
    setValue: (val) => send({ type: "VALUE.SET", value: val }),
    toggle: (val) => send({ type: "VALUE.TOGGLE", value: String(val) }),
    expand: (val) => send({ type: "VALUE.EXPAND", value: val }),
    collapse: (val) => send({ type: "VALUE.COLLAPSE", value: val }),
    expandAll: () => send({ type: "EXPAND_ALL" }),
    collapseAll: () => send({ type: "COLLAPSE_ALL" }),
    isOpen,
    getItemState,
    rootProps,
    getItemProps,
    getTriggerProps,
    getContentProps,
  };
}
