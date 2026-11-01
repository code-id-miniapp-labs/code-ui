import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type {
  Machine,
  MachineSchema,
  Params,
  Service,
} from "@code-ui/core";
import type { EventBus, MiniAppComponent } from "@code-ui/utils";
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

export interface TabsChangePayload {
  value: string | number;
  orientation: TabsOrientation;
  variant: TabsVariant;
  color: TabsColor;
  size: TabsSize;
  disabled: boolean;
}

export interface TabsBusEvents {
  "tabs:change": TabsChangePayload;
  "item:select": { value: string | number };
}

export interface TabsItem {
  id?: string | undefined;
  label?: string | undefined;
  value?: string | number | undefined;
  icon?: string | undefined;
  trailingIcon?: string | undefined;
  badge?: string | number | undefined;
  disabled?: boolean | undefined;
  content?: string | undefined;
  slot?: string | undefined;
  ui?: Record<string, any> | undefined;
  [key: string]: any;
}

export interface TabItemComputed {
  index: number;
  value: string | number;
  label: string;
  icon?: string | undefined;
  trailingIcon?: string | undefined;
  badge?: string | number | undefined;
  disabled: boolean;
  isSelected: boolean;
  content?: string | undefined;
  slot?: string | undefined;
  ui?: Record<string, any> | undefined;
  triggerProps: Record<string, any>;
  contentProps: Record<string, any>;
  [key: string]: any;
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
  /** Custom UI slot classes */
  ui?: TabsUI | undefined;
  /** Controlled active tab value */
  value?: string | number | null | undefined;
  /** Default active tab value */
  defaultValue?: string | number | null | undefined;
  /** Array of tab definitions or string labels */
  items?: Array<TabsItem | string> | undefined;
  /** Linked child tab definitions when using declarative <c-tabs-item> */
  childItems?: Array<TabsItem | string> | undefined;
  /** Number of linked child components */
  linkedCount?: number | undefined;
  /** Tabs orientation */
  orientation?: TabsOrientation | undefined;
  /** Visual variant */
  variant?: TabsVariant | undefined;
  /** Semantic color */
  color?: TabsColor | undefined;
  /** Size variant */
  size?: TabsSize | undefined;
  /** Whether the entire tabs component is disabled */
  disabled?: boolean | undefined;
  /** Whether navigation loops from end to start */
  loopFocus?: boolean | undefined;
  /** Selection trigger mode on focus */
  activationMode?: TabsActivationMode | undefined;
  /** Callback fired when the active tab changes */
  onChange?: ((details: TabsValueChangeDetails) => void) | undefined;
}

export interface NormalizedTabItem extends TabsItem {
  value: string | number;
  label: string;
  disabled: boolean;
}

export interface TabsContext {
  value: string | number;
  focusedValue: string | number | null;
}

export interface TabsComputed {
  selectedValue: string | number;
  selectedIndex: number;
  totalCount: number;
  isDisabled: boolean;
  selectedItem: NormalizedTabItem | undefined;
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
  bus?: EventBus<TabsBusEvents> | undefined;
  busDisposers?: Array<() => void> | undefined;
}

export interface TabsSchema extends MachineSchema {
  state: TabsState;
  tag: "idle" | "focused";
  event: TabsEvent;
  props: TabsProps;
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
  /** Component orientation */
  orientation: TabsOrientation;
  /** Visual variant */
  variant: TabsVariant;
  /** Visual color */
  color: TabsColor;
  /** Size variant */
  size: TabsSize;
  /** Whether tabs are disabled */
  disabled: boolean;
  /** Precomputed tab items snapshot */
  items: TabItemComputed[];
  /** Currently selected item descriptor */
  selectedItem?: TabsItem | undefined;

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
  /** Get active tab indicator element props */
  getIndicatorProps(): Record<string, any>;

  /** Precomputed root props */
  rootProps: Record<string, any>;
  /** Precomputed list props */
  listProps: Record<string, any>;
  /** Precomputed indicator props */
  indicatorProps: Record<string, any>;
}
