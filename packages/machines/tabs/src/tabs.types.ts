import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./tabs.anatomy";

export type TabsOrientation = "horizontal" | "vertical";
export type TabsVariant = "pill" | "link";
export type TabsColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info";
export type TabsSize = "xs" | "sm" | "md" | "lg" | "xl";
export type TabsActivationMode = "automatic" | "manual";
export type TabsState = "idle" | "focused";

export type TabsAnatomyPart = AnatomyPartName<typeof anatomy>;
export type TabsUI = ComponentUI<typeof anatomy>;
export type TabsResolvedUI = ResolvedUI<typeof anatomy>;

export interface TabsGroupContext {
  readonly value: () => string | number;
  readonly disabled: () => boolean;

  select: (value: string | number) => void;
  setValue: (value: string | number) => void;
  next: () => void;
  previous: () => void;
  first: () => void;
  last: () => void;
}

export interface TabsItem {
  id?: string | undefined;
  value?: string | number | undefined;
  disabled?: boolean | undefined;
}

export interface TabItemComputed {
  index: number;
  value: string | number;
  disabled: boolean;
  isSelected: boolean;
  triggerProps: Record<string, any>;
  contentProps: Record<string, any>;
}

export interface TabsValueChangeDetails {
  value: string | number;
  index: number;
  previousValue?: string | number | undefined;
}

export interface TabsProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Controlled active tab value */
  value?: string | number | null | undefined;
  /** Default active tab value */
  defaultValue?: string | number | null | undefined;
  /** Array of tab definitions or string values */
  items?: Array<TabsItem | string> | undefined;
  /** Linked child tab definitions when using declarative <c-tabs-item> */
  childItems?: Array<TabsItem | string> | undefined;
  /** Number of linked child components */
  linkedCount?: number | undefined;
  /** Whether the entire tabs component is disabled */
  disabled?: boolean | undefined;
  /** Whether navigation loops from end to start */
  loopFocus?: boolean | undefined;
  /** Selection trigger mode on focus */
  activationMode?: TabsActivationMode | undefined;
  /** Callback fired when the active tab changes */
  onChange?: ((details: TabsValueChangeDetails) => void) | undefined;
}

export type TabsDefaultedKey =
  | "value"
  | "defaultValue"
  | "disabled"
  | "loopFocus"
  | "activationMode"
  | "items";

export type TabsResolvedProps = Omit<TabsProps, TabsDefaultedKey> & {
  [K in TabsDefaultedKey]-?: Exclude<TabsProps[K], undefined>;
};

export interface NormalizedTabItem extends TabsItem {
  value: string | number;
  disabled: boolean;
}

export interface TabsContext {
  value: string | number;
  focusedValue: string | number | null;
}

export interface TabsComputed {
  selectedValue: string | number;
  selectedIndex: number;
  isDisabled: boolean;
  normalizedItems: NormalizedTabItem[];
}

export type TabsEvent =
  | { type: "SELECT"; value: string | number }
  | { type: "SET_VALUE"; value: string | number }
  | { type: "FOCUS"; value: string | number }
  | { type: "BLUR" }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "FIRST" }
  | { type: "LAST" };

export interface TabsRefs {
  groupContext: TabsGroupContext;
}

export interface TabsSchema extends MachineSchema {
  state: TabsState;
  tag: "idle" | "focused";
  event: TabsEvent;
  props: TabsResolvedProps;
  context: TabsContext;
  computed: TabsComputed;
  refs: TabsRefs;
  action: string;
  effect: string;
  guard: string;
}

export type TabsParams = Params<TabsSchema>;
export type TabsService = Service<TabsSchema>;
export type TabsMachine = Machine<TabsSchema>;

export interface TabsApi {
  /** The current active tab value */
  value: string | number;
  /** The index of the current active tab */
  selectedIndex: number;
  /** Currently focused tab value */
  focusedValue: string | number | null;
  /** Whether tabs are disabled */
  disabled: boolean;
  /** Precomputed tab items snapshot */
  items: TabItemComputed[];
  /** Active trigger element id for scroll-into-view */
  activeTriggerId: string;

  /** Set active tab by value */
  setValue(value: string | number): void;
  /** Select tab by value */
  select(value: string | number): void;
  /** Set focus to a tab */
  setFocus(value: string | number): void;
  /** Clear tab focus */
  clearFocus(): void;
  /** Select the next enabled tab */
  selectNext(): void;
  /** Select the previous enabled tab */
  selectPrev(): void;
  /** Select the first enabled tab */
  selectFirst(): void;
  /** Select the last enabled tab */
  selectLast(): void;

  /** Get root container element props */
  getRootProps(): Record<string, any>;
  /** Get tablist element props */
  getListProps(): Record<string, any>;
  /** Get trigger props for a tab */
  getTriggerProps(props: {
    value: string | number;
    index?: number | undefined;
  }): Record<string, any>;
  /** Get content panel props for a tab */
  getContentProps(props: {
    value: string | number;
    index?: number | undefined;
  }): Record<string, any>;

  /** Precomputed root props */
  rootProps: Record<string, any>;
  /** Precomputed list props */
  listProps: Record<string, any>;
}
