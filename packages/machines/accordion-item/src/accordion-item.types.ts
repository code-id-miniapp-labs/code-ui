import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type {
  AccordionGroupContext,
  AccordionSize,
  AccordionVariant,
} from "@code-ui/accordion";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./accordion-item.anatomy";

export type AccordionItemState = "idle";

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
  /** Custom UI slot classes */
  ui?: AccordionItemUI | undefined;
  /** Unique value of this item */
  value?: string | number | undefined;
  /** Primary label/title text */
  label?: string | undefined;
  /** Subtitle or description text */
  description?: string | undefined;
  /** Main body content text */
  content?: string | undefined;
  /** Leading icon name or path */
  icon?: string | undefined;
  /** Trailing icon name or path */
  trailingIcon?: string | undefined;
  /** Whether this item is disabled */
  disabled?: boolean | undefined;
  /** Controlled open state */
  open?: boolean | null | undefined;
  /** Default open state when uncontrolled */
  defaultOpen?: boolean | undefined;
  /** Explicit or measured content height in pixels */
  contentHeight?: number | undefined;
  /** Explicit item size (overrides group) */
  size?: AccordionSize | "" | undefined;
  /** Explicit item variant (overrides group) */
  variant?: AccordionVariant | "" | undefined;
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

export interface AccordionItemContext {
  id: string;
  value: string | number;
  label: string;
  description: string;
  content: string;
  icon: string;
  trailingIcon: string;
  disabled: boolean;
  open: boolean;
  size: AccordionSize | "";
  variant: AccordionVariant | "";
  collapsible: boolean;
  contentHeight: number;

  accordionId: string;
  groupIndex: number;

  ui: AccordionItemUI;
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
  isCollapsible: boolean;
  effectiveSize: AccordionSize;
  effectiveVariant: AccordionVariant;
}

export interface AccordionItemSchema extends MachineSchema {
  state: AccordionItemState;
  props: AccordionItemProps;
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
  isDisabled: boolean;
  /** Whether the item is collapsible */
  isCollapsible: boolean;
  /** Resolved item value */
  resolvedValue: string;
  /** Effective size */
  size: AccordionSize;
  /** Effective variant */
  variant: AccordionVariant;
  /** Label */
  label: string;
  /** Description */
  description: string;
  /** Content */
  content: string;
  /** Icon */
  icon: string;
  /** Trailing icon */
  trailingIcon: string;
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
  /** Handle tap event */
  handleTap: (e?: any) => void;
  /** Root container DOM props */
  itemProps: Record<string, any>;
  /** Trigger button DOM props */
  triggerProps: Record<string, any>;
  /** Content panel DOM props */
  contentProps: Record<string, any>;
  /** Label DOM props */
  labelProps: Record<string, any>;
  /** Leading icon DOM props */
  leadingIconProps: Record<string, any>;
  /** Trailing icon DOM props */
  trailingIconProps: Record<string, any>;
}
