import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { AccordionGroupContext } from "@code-id-labs/accordion";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { anatomy } from "./accordion-item.anatomy";

export type AccordionItemState = "open" | "closed";

export type AccordionItemAnatomyPart = AnatomyPartName<typeof anatomy>;
export type AccordionItemUI = ComponentUI<typeof anatomy>;
export type AccordionItemResolvedUI = ResolvedUI<typeof anatomy>;

export interface AccordionItemOpenChangeDetails {
  value: string;
  open: boolean;
}

export interface AccordionItemProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Unique value of this item */
  value?: string | number | undefined;
  /** Main body content text (tracked for height re-measurement) */
  content?: string | undefined;
  /** Whether this item is disabled */
  disabled?: boolean | undefined;
  /** Controlled open state */
  open?: boolean | null | undefined;
  /** Default open state when uncontrolled */
  defaultOpen?: boolean | undefined;
  /** Explicit or measured content height in pixels */
  contentHeight?: number | null | undefined;
  /** Whether the item can be collapsed when active (standalone mode) */
  collapsible?: boolean | undefined;

  /** Connected accordion group id */
  accordionId?: string | undefined;
  /** Live reactive state of the parent accordion */
  groupContext?: AccordionGroupContext | undefined;
  /** Index in parent accordion */
  groupIndex?: number | undefined;

  /** Tap callback */
  onTap?: ((details: AccordionItemOpenChangeDetails) => void) | undefined;
  /** Change callback */
  onChange?: ((details: AccordionItemOpenChangeDetails) => void) | undefined;
  /** Open change callback */
  onOpenChange?:
    | ((details: AccordionItemOpenChangeDetails) => void)
    | undefined;
}

export interface AccordionItemResolvedProps extends AccordionItemProps {
  value: string | number;
  content: string;
  disabled: boolean;
  open: boolean | null;
  defaultOpen: boolean;
  contentHeight: number | null;
  collapsible: boolean;
}

export interface AccordionItemContext {
  contentHeight: number;
}

export interface AccordionItemRefs {}

export type AccordionItemEvent =
  | { type: "TOGGLE" }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "MEASURE" }
  | { type: "CONTENT_HEIGHT.SET"; height: number };

export interface AccordionItemComputed {
  resolvedValue: string;
  isOpen: boolean;
  isDisabled: boolean;
  isInteractive: boolean;
  isCollapsible: boolean;
}

export interface AccordionItemSchema extends MachineSchema {
  state: AccordionItemState;
  tag: "open" | "closed";
  props: AccordionItemResolvedProps;
  context: AccordionItemContext;
  refs: AccordionItemRefs;
  computed: AccordionItemComputed;
  event: AccordionItemEvent;
}

export type AccordionItemService = Service<AccordionItemSchema>;
export type AccordionItemMachine = Machine<AccordionItemSchema>;
export type AccordionItemParams = Params<AccordionItemSchema>;

export interface AccordionItemApi {
  /** Whether the item is expanded */
  isOpen: boolean;
  /** Whether the item is disabled */
  disabled: boolean;
  /** Whether the item is collapsible */
  isCollapsible: boolean;
  /** Resolved item value */
  resolvedValue: string;
  /** Measured content height in pixels */
  contentHeight: number;
  /** Inline CSS style for content transition */
  contentStyle: string;
  /** Measure content height via selector query */
  measure: () => void;
  /** Manually set content height */
  setContentHeight: (height: number) => void;
  /** Toggle expanded state */
  toggle: () => void;
  /** Expand item */
  open: () => void;
  /** Collapse item */
  close: () => void;
  /** Handle tap interaction */
  handleTap: () => void;
  /** Root container DOM props */
  itemProps: Record<string, any>;
  /** Trigger button DOM props */
  triggerProps: Record<string, any>;
  /** Content panel DOM props */
  contentProps: Record<string, any>;
}
