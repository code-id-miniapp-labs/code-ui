import {
  getContentId,
  getLabelId,
  getRootId,
  getTriggerId,
} from "./accordion-item.dom";
import type {
  AccordionItemApi,
  AccordionItemService,
} from "./accordion-item.types";

export function connectAccordionItem(
  service: AccordionItemService,
): AccordionItemApi {
  const { context, computed, send, scope } = service;

  const resolvedValue = computed("resolvedValue");
  const isOpen = computed("isOpen");
  const isDisabled = computed("isDisabled");
  const isCollapsible = computed("isCollapsible");
  const size = computed("effectiveSize");
  const variant = computed("effectiveVariant");

  const label = context.get("label") ?? "";
  const description = context.get("description") ?? "";
  const content = context.get("content") ?? "";
  const icon = context.get("icon") ?? "";
  const trailingIcon = context.get("trailingIcon") ?? "";
  const accordionId = context.get("accordionId") || "";
  const contentHeight = context.get("contentHeight") ?? 0;

  const heightVal =
    contentHeight > 0 ? `${contentHeight}px` : isOpen ? "auto" : "0px";
  const heightVar = contentHeight > 0 ? `${contentHeight}px` : "auto";
  const contentStyle = isOpen
    ? `--cui-accordion-content-height: ${heightVar}; height: ${heightVal}; opacity: 1;`
    : `--cui-accordion-content-height: ${heightVar}; height: 0px; opacity: 0;`;

  const itemProps: Record<string, any> = {
    id: getRootId(scope, resolvedValue, accordionId),
    "data-scope": "accordion",
    "data-part": "item",
    "data-value": resolvedValue,
    "data-state": isOpen ? "open" : "closed",
    "data-disabled": String(isDisabled),
    "data-size": size,
    "data-variant": variant,
  };

  const triggerProps: Record<string, any> = {
    id: getTriggerId(scope, resolvedValue, accordionId),
    role: "button",
    "aria-expanded": String(isOpen),
    "aria-disabled": String(isDisabled),
    "data-scope": "accordion",
    "data-part": "trigger",
    "data-value": resolvedValue,
    "data-state": isOpen ? "open" : "closed",
    "data-disabled": String(isDisabled),
  };

  const contentProps: Record<string, any> = {
    id: getContentId(scope, resolvedValue, accordionId),
    role: "region",
    "aria-labelledby": getTriggerId(scope, resolvedValue, accordionId),
    "aria-hidden": String(!isOpen),
    style: contentStyle,
    "data-scope": "accordion",
    "data-part": "content",
    "data-value": resolvedValue,
    "data-state": isOpen ? "open" : "closed",
  };

  const labelProps: Record<string, any> = {
    id: getLabelId(scope, resolvedValue, accordionId),
    "data-scope": "accordion",
    "data-part": "label",
    "data-state": isOpen ? "open" : "closed",
  };

  const trailingIconProps: Record<string, any> = {
    "data-scope": "accordion",
    "data-part": "trailing-icon",
    "data-state": isOpen ? "open" : "closed",
  };

  const leadingIconProps: Record<string, any> = {
    "data-scope": "accordion",
    "data-part": "leading-icon",
  };

  const handleTap = () => {
    send({ type: "TOGGLE" });
  };

  return {
    isOpen,
    isDisabled,
    isCollapsible,
    resolvedValue,
    size,
    variant,
    label,
    description,
    content,
    icon,
    trailingIcon,
    contentHeight,
    contentStyle,
    measure: () => send({ type: "MEASURE" }),
    setContentHeight: (height: number) =>
      send({ type: "CONTENT_HEIGHT.SET", height }),
    toggle: handleTap,
    open: () => send({ type: "OPEN" }),
    close: () => send({ type: "CLOSE" }),
    handleTap,
    itemProps,
    triggerProps,
    contentProps,
    labelProps,
    trailingIconProps,
    leadingIconProps,
  };
}

