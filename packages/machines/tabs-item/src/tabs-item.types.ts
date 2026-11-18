import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type { TabsGroupContext } from "@code-id-labs/tabs";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { anatomy } from "./tabs-item.anatomy";

export type TabsItemAnatomyPart = AnatomyPartName<typeof anatomy>;
export type TabsItemUI = ComponentUI<typeof anatomy>;
export type TabsItemResolvedUI = ResolvedUI<typeof anatomy>;

export interface TabsItemProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  component?: MiniAppComponent | undefined;

  /** Tab value identifier */
  value?: string | number | undefined;
  /** Whether the tab is disabled */
  disabled?: boolean | undefined;
  /** Direct selected state (e.g. passed from tabs machine) */
  selected?: boolean | null | undefined;
  /** Explicit trigger DOM id */
  triggerId?: string | undefined;
  /** Index override */
  index?: number | null | undefined;
  /** Callback fired when an unlinked item is selected */
  onSelect?: ((details: { value: string | number }) => void) | undefined;

  /** Parent tabs scope ID */
  tabsId?: string | undefined;
  /** Live reactive state of the parent tabs */
  groupContext?: TabsGroupContext | undefined;
  /** Index among siblings */
  groupIndex?: number | undefined;
}

export type TabsItemDefaultedKey =
  | "value"
  | "disabled"
  | "selected"
  | "triggerId"
  | "index";

export type TabsItemResolvedProps = Omit<TabsItemProps, TabsItemDefaultedKey> & {
  [K in TabsItemDefaultedKey]-?: Exclude<TabsItemProps[K], undefined>;
};

export interface TabsItemComputed {
  resolvedValue: string | number;
  isSelected: boolean;
  isDisabled: boolean;
  index: number;
}

export type TabsItemEvent = { type: "SELECT" };

export type TabsItemState = "active" | "inactive";

export interface TabsItemSchema extends MachineSchema {
  state: TabsItemState;
  tag: "active" | "inactive";
  event: TabsItemEvent;
  props: TabsItemResolvedProps;
  computed: TabsItemComputed;
  action: string;
  effect: string;
  guard: string;
}

export type TabsItemParams = Params<TabsItemSchema>;
export type TabsItemService = Service<TabsItemSchema>;
export type TabsItemMachine = Machine<TabsItemSchema>;

export interface TabsItemApi {
  state: TabsItemState;
  value: string | number;
  isSelected: boolean;
  disabled: boolean;
  index: number;

  select(): void;

  getContentProps(): Record<string, any>;
  getTriggerProps(): Record<string, any>;

  contentProps: Record<string, any>;
  triggerProps: Record<string, any>;
}
