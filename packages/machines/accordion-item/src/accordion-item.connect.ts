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
  const { context, computed, prop, send, scope } = service;

  const resolvedValue = computed("resolvedValue");
  const isOpen = computed("isOpen");
  const isDisabled = computed("isDisabled");
  const isCollapsible = computed("isCollapsible");
  const size = computed("effectiveSize");
  const variant = computed("effectiveVariant");

  const label = prop("label") ?? "";
  const description = prop("description") ?? "";
  const content = prop("content") ?? "";
  const icon = prop("icon") ?? "";
  const trailingIcon = prop("trailingIcon") ?? "";
  const accordionId = prop("accordionId") || "";
  const contentHeight = context.get("contentHeight") ?? 0;

  const heightVar = contentHeight > 0 ? `${contentHeight}px` : "auto";
  const heightVal = isOpen ? heightVar : "0px";
  const contentStyle = `--cui-accordion-content-height: ${heightVar}; height: ${heightVal}; opacity: ${isOpen ? 1 : 0};`;
  const stateStr = isOpen ? "open" : "closed";
  const triggerId = getTriggerId(scope, resolvedValue, accordionId);
  const lbId = getLabelId(scope, resolvedValue, accordionId);

  const itemProps: Record<string, any> = {
    id: getRootId(scope, resolvedValue, accordionId),
    "data-value": resolvedValue,
    "data-state": stateStr,
    "data-disabled": String(isDisabled),
  };

  const triggerProps: Record<string, any> = {
    id: triggerId,
    "aria-role": "button",
    "aria-disabled": isDisabled,
    "aria-expanded": isOpen,
    "data-value": resolvedValue,
    "data-state": stateStr,
    "data-disabled": String(isDisabled),
  };

  const contentProps: Record<string, any> = {
    id: getContentId(scope, resolvedValue, accordionId),
    "aria-role": "region",
    "aria-labelledby": triggerId,
    "aria-hidden": !isOpen,
    style: contentStyle,
    "data-value": resolvedValue,
    "data-state": stateStr,
  };

  const labelProps: Record<string, any> = {
    ...(lbId ? { id: lbId } : {}),
    "data-state": stateStr,
  };

  const trailingIconProps: Record<string, any> = {
    "data-state": stateStr,
  };
  const leadingIconProps: Record<string, any> = {};

  const handleTap = () => send({ type: "TOGGLE" });

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
    leadingIconProps,
    trailingIconProps,
  };
}
