import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type {
  SelectColor,
  SelectGroupContext,
  SelectItemType,
  SelectScalarValue,
  SelectSize,
} from "@code-ui/select";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./select-item.anatomy";

export type SelectItemState = "selected" | "unselected";
export type SelectItemTag = "selected" | "unselected";

export type SelectItemColor = SelectColor;
export type SelectItemSize = SelectSize;

export type SelectItemAnatomyPart = AnatomyPartName<typeof anatomy>;
export type SelectItemUI = ComponentUI<typeof anatomy>;
export type SelectItemResolvedUI = ResolvedUI<typeof anatomy>;

export interface SelectItemProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  component?: MiniAppComponent | undefined;
  /** Option value identifier */
  value?: SelectScalarValue | undefined;
  /** Item kind ('item' | 'label' | 'separator') */
  type?: SelectItemType | undefined;
  /** Whether the option is disabled */
  disabled?: boolean | undefined;
  /** Direct selected state override */
  selected?: boolean | null | undefined;
  /** Internal flag marking items rendered via parent wx:for */
  managed?: boolean | undefined;
  /** Explicit index override */
  index?: number | null | undefined;
  /** Parent select scope ID */
  selectId?: string | undefined;
  /** Live reactive state of parent select */
  groupContext?: SelectGroupContext | undefined;
  /** Index among declarative siblings */
  groupIndex?: number | undefined;
  /** Callback fired when item is selected */
  onSelect?: ((details: { value: SelectScalarValue }) => void) | undefined;
}

type SelectItemDefaultedKey =
  | "value"
  | "type"
  | "disabled"
  | "selected"
  | "managed"
  | "index";

export type SelectItemResolvedProps = Omit<
  SelectItemProps,
  SelectItemDefaultedKey
> & {
  [K in SelectItemDefaultedKey]-?: Exclude<SelectItemProps[K], undefined>;
};

export interface SelectItemComputed {
  resolvedValue: SelectScalarValue;
  isSelected: boolean;
  isDisabled: boolean;
  index: number;
}

export type SelectItemEvent = { type: "SELECT" };

export interface SelectItemSchema extends MachineSchema {
  state: SelectItemState;
  tag: SelectItemTag;
  event: SelectItemEvent;
  props: SelectItemResolvedProps;
  computed: SelectItemComputed;
  action: string;
  effect: string;
  guard: string;
}

export type SelectItemParams = Params<SelectItemSchema>;
export type SelectItemService = Service<SelectItemSchema>;
export type SelectItemMachine = Machine<SelectItemSchema>;

export interface SelectItemApi {
  state: SelectItemState;
  value: SelectScalarValue;
  selected: boolean;
  disabled: boolean;
  index: number;

  select(): void;
  rootProps: Record<string, any>;
}
