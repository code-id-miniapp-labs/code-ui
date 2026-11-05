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
import type {
  TabsColor,
  TabsGroupContext,
  TabsOrientation,
  TabsSize,
  TabsVariant,
} from "@code-ui/tabs";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./tabs-item.anatomy";

export type TabsItemAnatomyPart = AnatomyPartName<typeof anatomy>;
export type TabsItemUI = ComponentUI<typeof anatomy>;
export type TabsItemResolvedUI = ResolvedUI<typeof anatomy>;

export interface TabsItemProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  component?: MiniAppComponent | undefined;
  ui?: TabsItemUI | undefined;

  /** Render mode: trigger button, content panel, or auto */
  mode?: "auto" | "trigger" | "panel" | undefined;
  /** Tab value identifier */
  value?: string | number | undefined;
  /** Tab label text */
  label?: string | undefined;
  /** Leading icon name */
  icon?: string | undefined;
  /** Trailing icon name */
  trailingIcon?: string | undefined;
  /** Whether the tab is disabled */
  disabled?: boolean | undefined;
  /** Direct selected state (e.g. passed from tabs machine) */
  selected?: boolean | null | undefined;
  /** Explicit trigger DOM id */
  triggerId?: string | undefined;
  /** Whether the tab trigger is fitted (equal width) */
  fitted?: boolean | undefined;
  /** Whether to lazily render slot content until active */
  lazy?: boolean | undefined;

  /** Orientation override or from parent */
  orientation?: TabsOrientation | undefined;
  /** Variant override or from parent */
  variant?: TabsVariant | undefined;
  /** Color override or from parent */
  color?: TabsColor | undefined;
  /** Size override or from parent */
  size?: TabsSize | undefined;
  /** Index override */
  index?: number | undefined;

  /** Parent tabs scope ID */
  tabsId?: string | undefined;
  /** Live reactive state of the parent tabs */
  groupContext?: TabsGroupContext | undefined;
  /** Index among siblings */
  groupIndex?: number | undefined;
}

export interface TabsItemComputed {
  resolvedValue: string | number;
  isSelected: boolean;
  isDisabled: boolean;
}

export type TabsItemEvent =
  | { type: "SELECT" };

export type TabsItemState = "idle";

export interface TabsItemSchema extends MachineSchema {
  state: TabsItemState;
  tag: "idle";
  event: TabsItemEvent;
  props: TabsItemProps;
  computed: TabsItemComputed;
  action: string;
  effect: string;
  guard: string;
}

export type TabsItemParams = Params<TabsItemSchema>;
export type TabsItemService = Service<TabsItemSchema>;
export type TabsItemMachine = Machine<TabsItemSchema>;

export interface TabsItemApi {
  value: string | number;
  label: string;
  icon?: string | undefined;
  trailingIcon?: string | undefined;
  isSelected: boolean;
  isDisabled: boolean;
  lazy: boolean;
  mode: "auto" | "trigger" | "panel";
  orientation: TabsOrientation;
  variant: TabsVariant;
  color: TabsColor;
  size: TabsSize;
  fitted: boolean;
  index: number;

  select(): void;

  getRootProps(): Record<string, any>;
  getContentProps(): Record<string, any>;
  getTriggerProps(): Record<string, any>;

  rootProps: Record<string, any>;
  contentProps: Record<string, any>;
  triggerProps: Record<string, any>;
}
