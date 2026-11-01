import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { EventBus, MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./accordion.anatomy";

export type AccordionState = "idle";

export type AccordionSize = "sm" | "md" | "lg";

export type AccordionVariant =
  | "outline"
  | "subtle"
  | "soft"
  | "plain"
  | "separated";

export interface AccordionChangePayload {
  value: string[];
  multiple: boolean;
  collapsible: boolean;
  disabled: boolean;
  size: AccordionSize;
  variant: AccordionVariant;
}

export interface AccordionBusEvents {
  "accordion:change": AccordionChangePayload;
  "item:toggle": { value: string; index?: number | undefined };
}

export type AccordionAnatomyPart = AnatomyPartName<typeof anatomy>;
export type AccordionUI = ComponentUI<typeof anatomy>;
export type AccordionResolvedUI = ResolvedUI<typeof anatomy>;

export interface AccordionValueChangeDetails {
  value: string[];
  expanded: string[];
}

export interface AccordionItemData {
  value?: string | number | undefined;
  label?: string | undefined;
  description?: string | undefined;
  content?: string | undefined;
  icon?: string | undefined;
  trailingIcon?: string | undefined;
  disabled?: boolean | undefined;
  ui?: Record<string, any> | undefined;
  [key: string]: any;
}

export interface AccordionItemSnapshot {
  index: number;
  value: string;
  label: string;
  description: string;
  content: string;
  icon: string;
  trailingIcon: string;
  isOpen: boolean;
  isDisabled: boolean;
  ui?: Record<string, any> | undefined;
  itemProps: Record<string, any>;
  triggerProps: Record<string, any>;
  contentProps: Record<string, any>;
  labelProps: Record<string, any>;
  trailingIconProps: Record<string, any>;
  leadingIconProps: Record<string, any>;
}

export interface AccordionProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Custom UI slot classes */
  ui?: AccordionUI | undefined;
  /** Controlled active values */
  value?: string | number | (string | number)[] | null | undefined;
  /** Default active values when uncontrolled */
  defaultValue?: string | number | (string | number)[] | null | undefined;
  /** ModelValue alias for value */
  modelValue?: string | number | (string | number)[] | null | undefined;
  /** Whether multiple items can be open simultaneously */
  multiple?: boolean | undefined;
  /** Whether an open item can be closed */
  collapsible?: boolean | undefined;
  /** Whether the accordion is disabled */
  disabled?: boolean | undefined;
  /** Size variant */
  size?: AccordionSize | undefined;
  /** Visual variant */
  variant?: AccordionVariant | undefined;
  /** Programmatic list of items */
  items?: AccordionItemData[] | undefined;
  /** Count of linked declarative children */
  linkedCount?: number | undefined;
  /** Change event handler */
  onChange?: ((details: AccordionValueChangeDetails) => void) | undefined;
  /** Model value sync handler */
  onUpdateModelValue?: ((value: string | string[]) => void) | undefined;
}

export interface AccordionContext {
  id: string;
  value: string[];
  multiple: boolean;
  collapsible: boolean;
  disabled: boolean;
  size: AccordionSize;
  variant: AccordionVariant;
  items: AccordionItemData[];
  linkedCount: number;
  ui: AccordionUI;
}

export interface AccordionRefs {
  bus: EventBus<AccordionBusEvents>;
  busDisposers: (() => void)[];
}

export type AccordionEvent =
  | { type: "VALUE.SET"; value: string | number | (string | number)[] }
  | { type: "VALUE.TOGGLE"; value: string }
  | { type: "EXPAND_ALL" }
  | { type: "COLLAPSE_ALL" };

export interface AccordionComputed {
  expandedValues: string[];
  isMultiple: boolean;
  isCollapsible: boolean;
  isDisabled: boolean;
  totalCount: number;
}

export interface AccordionSchema extends MachineSchema {
  state: AccordionState;
  props: AccordionProps;
  context: AccordionContext;
  refs: AccordionRefs;
  computed: AccordionComputed;
  event: AccordionEvent;
}

export type AccordionService = Service<AccordionSchema>;
export type AccordionMachine = Machine<AccordionSchema>;
export type AccordionParams = Params<AccordionSchema>;

export interface AccordionApi {
  /** The currently expanded value(s) */
  value: string[];
  /** Whether multiple items can be expanded */
  multiple: boolean;
  /** Whether the accordion is collapsible */
  collapsible: boolean;
  /** Whether the accordion is disabled */
  disabled: boolean;
  /** Size variant */
  size: AccordionSize;
  /** Visual variant */
  variant: AccordionVariant;
  /** Whether there are programmatic items */
  hasItems: boolean;
  /** Pre-computed array of items for WXML loop */
  items: AccordionItemSnapshot[];
  /** Set the active value(s) */
  setValue: (value: string | number | (string | number)[]) => void;
  /** Toggle an item's expanded state */
  toggle: (value: string | number) => void;
  /** Expand one or more items */
  expand: (value: string | number | (string | number)[]) => void;
  /** Collapse one or more items */
  collapse: (value: string | number | (string | number)[]) => void;
  /** Expand all items (in multiple mode) */
  expandAll: () => void;
  /** Collapse all items */
  collapseAll: () => void;
  /** Check if a specific item is open */
  isOpen: (value: string | number) => boolean;
  /** Get an item's current state */
  getItemState: (value: string | number) => {
    isOpen: boolean;
    isDisabled: boolean;
  };
  /** Root container DOM props */
  rootProps: Record<string, any>;
  /** Get props for a programmatic item */
  getItemProps: (props: { value: string | number; index?: number }) => Record<string, any>;
  /** Get props for an item's trigger */
  getTriggerProps: (props: { value: string | number; index?: number }) => Record<string, any>;
  /** Get props for an item's content */
  getContentProps: (props: { value: string | number; index?: number }) => Record<string, any>;
}
