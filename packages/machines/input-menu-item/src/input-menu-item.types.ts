import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type {
  InputMenuColor,
  InputMenuGroupContext,
  InputMenuItemType,
  InputMenuScalarValue,
  InputMenuSize,
} from "@code-ui/input-menu";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./input-menu-item.anatomy";

export type InputMenuItemState = "selected" | "unselected";
export type InputMenuItemTag = "selected" | "unselected";

export type InputMenuItemColor = InputMenuColor;
export type InputMenuItemSize = InputMenuSize;

export type InputMenuItemAnatomyPart = AnatomyPartName<typeof anatomy>;
export type InputMenuItemUI = ComponentUI<typeof anatomy>;
export type InputMenuItemResolvedUI = ResolvedUI<typeof anatomy>;

export interface InputMenuItemProps {
  id?: string | undefined;
  ids?: Record<string, any> | undefined;
  component?: MiniAppComponent | undefined;
  /** Option value identifier */
  value?: InputMenuScalarValue | undefined;
  /** Item kind ('item' | 'label' | 'separator') */
  type?: InputMenuItemType | undefined;
  /** Whether the option is disabled */
  disabled?: boolean | undefined;
  /** Direct selected state override */
  selected?: boolean | null | undefined;
  /** Internal flag marking items rendered via parent wx:for */
  managed?: boolean | undefined;
  /** Explicit index override */
  index?: number | null | undefined;
  /** Parent input-menu scope ID */
  inputMenuId?: string | undefined;
  /** Live reactive state of parent input-menu */
  groupContext?: InputMenuGroupContext | undefined;
  /** Index among declarative siblings */
  groupIndex?: number | undefined;
  /** Callback fired when item is selected */
  onSelect?: ((details: { value: InputMenuScalarValue }) => void) | undefined;
}

type InputMenuItemDefaultedKey =
  | "value"
  | "type"
  | "disabled"
  | "selected"
  | "managed"
  | "index";

export type InputMenuItemResolvedProps = Omit<
  InputMenuItemProps,
  InputMenuItemDefaultedKey
> & {
  [K in InputMenuItemDefaultedKey]-?: Exclude<InputMenuItemProps[K], undefined>;
};

export interface InputMenuItemComputed {
  resolvedValue: InputMenuScalarValue;
  isSelected: boolean;
  isDisabled: boolean;
  isHidden: boolean;
  index: number;
}

export type InputMenuItemEvent = { type: "SELECT" };

export interface InputMenuItemSchema extends MachineSchema {
  state: InputMenuItemState;
  tag: InputMenuItemTag;
  event: InputMenuItemEvent;
  props: InputMenuItemResolvedProps;
  computed: InputMenuItemComputed;
  action: string;
  effect: string;
  guard: string;
}

export type InputMenuItemParams = Params<InputMenuItemSchema>;
export type InputMenuItemService = Service<InputMenuItemSchema>;
export type InputMenuItemMachine = Machine<InputMenuItemSchema>;

export interface InputMenuItemApi {
  state: InputMenuItemState;
  value: InputMenuScalarValue;
  selected: boolean;
  disabled: boolean;
  hidden: boolean;
  index: number;

  select(): void;
  rootProps: Record<string, any>;
}
