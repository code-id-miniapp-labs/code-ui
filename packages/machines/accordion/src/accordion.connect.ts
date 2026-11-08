import {
  getContentId,
  getItemId,
  getLabelId,
  getRootId,
  getTriggerId,
} from "./accordion.dom";
import type {
  AccordionApi,
  AccordionItemSnapshot,
  AccordionService,
  AccordionSize,
  AccordionVariant,
} from "./accordion.types";

export function connectAccordion(service: AccordionService): AccordionApi {
  const { context, prop, send, scope } = service;

  const value = context.get("value") ?? [];
  const multiple = Boolean(prop("multiple"));
  const collapsible = prop("collapsible") !== false;
  const disabled = Boolean(prop("disabled"));
  const size = (prop("size") || "md") as AccordionSize;
  const variant = (prop("variant") || "outline") as AccordionVariant;
  const rawItems = prop("items") ?? [];
  const hasItems = Array.isArray(rawItems) && rawItems.length > 0;

  const isOpen = (val: string | number): boolean => value.includes(String(val));

  const getItemState = (val: string | number) => {
    const valStr = String(val);
    const item = hasItems
      ? rawItems.find((it, idx) => String(it.value ?? idx) === valStr)
      : undefined;
    return {
      isOpen: value.includes(valStr),
      isDisabled: disabled || Boolean(item?.disabled),
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
    return buildItemProps(val, st.isOpen, st.isDisabled);
  };

  const getTriggerProps = (props: {
    value: string | number;
    index?: number;
  }): Record<string, any> => {
    const val = String(props.value);
    const st = getItemState(val);
    return buildTriggerProps(val, st.isOpen, st.isDisabled);
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
        const stateStr = open ? "open" : "closed";
        const lbId = getLabelId(scope, valStr);

        return {
          index,
          value: valStr,
          label: item.label ?? "",
          description: item.description ?? "",
          content: item.content ?? "",
          icon: item.icon ?? "",
          trailingIcon: item.trailingIcon ?? "",
          isOpen: open,
          isDisabled: isItemDisabled,
          ui: item.ui,
          itemProps: buildItemProps(valStr, open, isItemDisabled),
          triggerProps: buildTriggerProps(valStr, open, isItemDisabled),
          contentProps: buildContentProps(valStr, open),
          labelProps: lbId ? { id: lbId } : {},
          trailingIconProps: { "data-state": stateStr },
          leadingIconProps: {},
        };
      })
    : [];

  return {
    value,
    multiple,
    collapsible,
    disabled,
    size,
    variant,
    hasItems,
    items: computedItems,
    setValue: (val) => send({ type: "VALUE.SET", value: val }),
    toggle: (val) => send({ type: "VALUE.TOGGLE", value: String(val) }),
    expand: (val) => {
      const targets = Array.isArray(val) ? val.map(String) : [String(val)];
      const next = multiple
        ? Array.from(new Set([...value, ...targets]))
        : [targets[0] ?? ""];
      send({ type: "VALUE.SET", value: next });
    },
    collapse: (val) => {
      const targets = Array.isArray(val) ? val.map(String) : [String(val)];
      const next = value.filter((v) => !targets.includes(v));
      if (!collapsible && next.length === 0) return;
      send({ type: "VALUE.SET", value: next });
    },
    expandAll: () => send({ type: "EXPAND_ALL" }),
    collapseAll: () => {
      if (collapsible) send({ type: "COLLAPSE_ALL" });
    },
    isOpen,
    getItemState,
    rootProps,
    getItemProps,
    getTriggerProps,
    getContentProps,
  };
}
