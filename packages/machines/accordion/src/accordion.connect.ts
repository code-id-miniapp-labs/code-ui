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
} from "./accordion.types";

export function connectAccordion(service: AccordionService): AccordionApi {
  const { context, send, scope } = service;

  const value = context.get("value") ?? [];
  const multiple = Boolean(context.get("multiple"));
  const collapsible = context.get("collapsible") !== false;
  const disabled = Boolean(context.get("disabled"));
  const size = context.get("size") || "md";
  const variant = context.get("variant") || "outline";
  const rawItems = context.get("items") ?? [];
  const hasItems = Array.isArray(rawItems) && rawItems.length > 0;

  const isOpen = (val: string | number): boolean => {
    return value.includes(String(val));
  };

  const getItemState = (val: string | number) => {
    const valStr = String(val);
    const item = Array.isArray(rawItems)
      ? rawItems.find((it, idx) => String(it.value ?? idx) === valStr)
      : undefined;
    const isItemDisabled = disabled || Boolean(item?.disabled);
    return {
      isOpen: value.includes(valStr),
      isDisabled: isItemDisabled,
    };
  };

  const rootProps: Record<string, any> = {
    id: getRootId(scope),
    "data-scope": "accordion",
    "data-part": "root",
    "data-disabled": disabled,
    "data-size": size,
    "data-variant": variant,
  };

  const getItemProps = (props: {
    value: string | number;
    index?: number;
  }): Record<string, any> => {
    const val = String(props.value);
    const open = isOpen(val);
    const state = getItemState(val);
    return {
      id: getItemId(scope, val),
      "data-scope": "accordion",
      "data-part": "item",
      "data-value": val,
      "data-state": open ? "open" : "closed",
      "data-disabled": state.isDisabled,
    };
  };

  const getTriggerProps = (props: {
    value: string | number;
    index?: number;
  }): Record<string, any> => {
    const val = String(props.value);
    const open = isOpen(val);
    const state = getItemState(val);
    return {
      id: getTriggerId(scope, val),
      role: "button",
      "aria-expanded": open,
      "aria-disabled": state.isDisabled,
      "data-scope": "accordion",
      "data-part": "trigger",
      "data-value": val,
      "data-state": open ? "open" : "closed",
      "data-disabled": state.isDisabled,
    };
  };

  const getContentProps = (props: {
    value: string | number;
    index?: number;
  }): Record<string, any> => {
    const val = String(props.value);
    const open = isOpen(val);
    return {
      id: getContentId(scope, val),
      role: "region",
      "aria-labelledby": getTriggerId(scope, val),
      hidden: !open,
      "data-scope": "accordion",
      "data-part": "content",
      "data-value": val,
      "data-state": open ? "open" : "closed",
    };
  };

  const computedItems: AccordionItemSnapshot[] = hasItems
    ? rawItems.map((item, index) => {
        const valStr = String(item.value ?? index);
        const open = isOpen(valStr);
        const isItemDisabled = disabled || Boolean(item.disabled);

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
          itemProps: {
            id: getItemId(scope, valStr),
            "data-scope": "accordion",
            "data-part": "item",
            "data-value": valStr,
            "data-state": open ? "open" : "closed",
            "data-disabled": isItemDisabled,
          },
          triggerProps: {
            id: getTriggerId(scope, valStr),
            role: "button",
            "aria-expanded": open,
            "aria-disabled": isItemDisabled,
            "data-scope": "accordion",
            "data-part": "trigger",
            "data-value": valStr,
            "data-state": open ? "open" : "closed",
            "data-disabled": isItemDisabled,
          },
          contentProps: {
            id: getContentId(scope, valStr),
            role: "region",
            "aria-labelledby": getTriggerId(scope, valStr),
            hidden: !open,
            "data-scope": "accordion",
            "data-part": "content",
            "data-value": valStr,
            "data-state": open ? "open" : "closed",
          },
          labelProps: {
            id: getLabelId(scope, valStr),
            "data-scope": "accordion",
            "data-part": "label",
          },
          trailingIconProps: {
            "data-scope": "accordion",
            "data-part": "trailing-icon",
            "data-state": open ? "open" : "closed",
          },
          leadingIconProps: {
            "data-scope": "accordion",
            "data-part": "leading-icon",
          },
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
    setValue: (val) => {
      send({ type: "VALUE.SET", value: val });
    },
    toggle: (val) => {
      send({ type: "VALUE.TOGGLE", value: String(val) });
    },
    expand: (val) => {
      const targets = Array.isArray(val) ? val.map(String) : [String(val)];
      const current = [...value];
      const next = multiple
        ? Array.from(new Set([...current, ...targets]))
        : [targets[0] ?? ""];
      send({ type: "VALUE.SET", value: next });
    },
    collapse: (val) => {
      const targets = Array.isArray(val) ? val.map(String) : [String(val)];
      const next = value.filter((v) => !targets.includes(v));
      if (!collapsible && next.length === 0) {
        return;
      }
      send({ type: "VALUE.SET", value: next });
    },
    expandAll: () => {
      send({ type: "EXPAND_ALL" });
    },
    collapseAll: () => {
      if (!collapsible) return;
      send({ type: "COLLAPSE_ALL" });
    },
    isOpen,
    getItemState,
    rootProps,
    getItemProps,
    getTriggerProps,
    getContentProps,
  };
}
