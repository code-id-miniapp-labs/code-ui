import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { anatomy } from "./action-sheet.anatomy";

export type ActionSheetState = "open" | "closed" | "closing";
export type ActionSheetTag = "open" | "closed" | "closing";

export type ActionSheetAnatomyPart = AnatomyPartName<typeof anatomy>;
export type ActionSheetUI = ComponentUI<typeof anatomy>;
export type ActionSheetResolvedUI = ResolvedUI<typeof anatomy>;

export interface ActionSheetItem {
  /** Unique key for the item (optional) */
  key?: string | undefined;
  /** Primary label of the item */
  label: string;
  /** Secondary description / subname below the label */
  description?: string | undefined;
  /** Icon name to display alongside the label */
  icon?: string | undefined;
  /** Loading icon override for this specific action item */
  loadingIcon?: string | undefined;
  /** Color variant or semantic color */
  color?: string | undefined;
  /** Whether this is a destructive item (renders with warning/red tone) */
  destructive?: boolean | undefined;
  /** Whether this item is disabled */
  disabled?: boolean | undefined;
  /** Whether this item is in a loading state */
  loading?: boolean | undefined;
  /** WeChat button open-type */
  openType?: string | undefined;
  /** Custom CSS class for this item */
  className?: string | undefined;
  /** Inline style for this item */
  style?: string | undefined;
}

export interface ActionSheetAction {
  /** Label of the button */
  label: string;
  /** Click handler (supports sync or async) */
  onClick?: (() => void | Promise<void>) | undefined;
  /** Optional icon */
  icon?: string | undefined;
  /** Leading icon */
  leadingIcon?: string | undefined;
  /** Trailing icon */
  trailingIcon?: string | undefined;
  /** Loading state */
  loading?: boolean | undefined;
  /** Perform auto loading when onClick is async function */
  loadingAuto?: boolean | undefined;
  /** Loading icon override */
  loadingIcon?: string | undefined;
  /** Button color ('primary' | 'neutral' | 'danger' etc.) */
  color?: string | undefined;
  /** Button variant ('solid' | 'outline' | 'soft' | 'ghost') */
  variant?: string | undefined;
  /** Button size ('xs' | 'sm' | 'md' | 'lg' | 'xl') */
  size?: string | undefined;
  /** Whether clicking this action automatically closes the sheet (default: true) */
  closeOnClick?: boolean | undefined;
  /** Disabled state */
  disabled?: boolean | undefined;
  /** WeChat button open-type */
  openType?: string | undefined;
  /** Custom CSS class */
  className?: string | undefined;
  /** Custom UI overrides for this c-button */
  ui?: any | undefined;
}

export interface ActionSheetCloseProps {
  icon?: string | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  size?: string | undefined;
  disabled?: boolean | undefined;
  ui?: Record<string, any> | undefined;
  className?: string | undefined;
}

export interface ActionSheetSelectDetails {
  item: ActionSheetItem;
  index: number;
}

export interface ActionSheetActionDetails {
  action: ActionSheetAction;
  index: number;
}

export interface ActionSheetOpenChangeDetails {
  open: boolean;
}

export interface ActionSheetProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Whether the action sheet is open (controlled) */
  open?: boolean | null | undefined;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean | undefined;
  /** Array of menu items */
  items?: ActionSheetItem[] | undefined;
  /** Array of footer actions powered by <c-button> */
  actions?: ActionSheetAction[] | undefined;
  /** Whether clicking a menu item automatically closes the sheet (default: true) */
  closeOnItem?: boolean | undefined;
  /** Whether clicking the backdrop closes the sheet (default: true) */
  closeOnBackdropClick?: boolean | undefined;
  /** Transition duration in ms */
  duration?: number | undefined;
  /** Callback fired when open state changes */
  onOpenChange?: ((details: ActionSheetOpenChangeDetails) => void) | undefined;
  /** Callback fired when a menu item is selected */
  onSelect?: ((details: ActionSheetSelectDetails) => void) | undefined;
  /** Callback fired when a footer action is tapped */
  onAction?:
    | ((details: ActionSheetActionDetails) => void | Promise<any>)
    | undefined;
  /** Callback fired when action sheet closes */
  onClose?: (() => void) | undefined;
  /** Callback fired after the action sheet exit animation finishes and enters closed state */
  onExitComplete?: (() => void) | undefined;
}

export interface ActionSheetResolvedProps extends ActionSheetProps {
  open: boolean | null;
  defaultOpen: boolean;
  items: ActionSheetItem[];
  actions: ActionSheetAction[];
  closeOnItem: boolean;
  closeOnBackdropClick: boolean;
  duration: number;
}

export type ActionSheetEvent =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" }
  | { type: "BACKDROP.TAP" }
  | { type: "CLOSE_TRIGGER.TAP" }
  | { type: "SELECT"; index: number }
  | { type: "ACTION"; index: number }
  | { type: "ACTION_SETTLED"; index: number }
  | { type: "ANIMATION_END" };

export interface ActionSheetContext {
  loadingActionIndex: number | null;
}

export interface ActionSheetComputed {
  isOpen: boolean;
  isVisible: boolean;
}

export type ActionSheetMachineAction =
  | "invokeOnOpen"
  | "invokeOnClose"
  | "invokeOnExitComplete"
  | "invokeOnSelect"
  | "invokeOnAction"
  | "clearActionLoadingContext";

export type ActionSheetGuard =
  | "closeOnBackdropClick"
  | "canSelectItem"
  | "shouldCloseOnItem"
  | "canHandleAction"
  | "shouldCloseOnAction";

export type ActionSheetEffect = "waitForCloseAnimation";

export interface ActionSheetSchema extends MachineSchema {
  state: ActionSheetState;
  tag: ActionSheetTag;
  event: ActionSheetEvent;
  props: ActionSheetResolvedProps;
  context: ActionSheetContext;
  computed: ActionSheetComputed;
  action: ActionSheetMachineAction;
  effect: ActionSheetEffect;
  guard: ActionSheetGuard;
}

export type ActionSheetMachine = Machine<ActionSheetSchema>;
export type ActionSheetService = Service<ActionSheetSchema>;
export type ActionSheetParams = Params<ActionSheetSchema>;

export interface ActionSheetApi {
  /** Whether the action sheet is open */
  open: boolean;
  /** Whether the action sheet is visible / mounted (true during 'open' and 'closing') */
  visible: boolean;
  /** Current machine state ('open' | 'closed' | 'closing') */
  state: ActionSheetState;
  /** Index of the footer action currently in async loading state, or null */
  loadingActionIndex: number | null;
  /** Open or close the action sheet */
  setOpen(open: boolean): void;
  /** Open the action sheet */
  openActionSheet(): void;
  /** Close the action sheet */
  closeActionSheet(): void;
  /** Select item at index */
  select(index: number): void;
  /** Trigger footer action at index */
  handleAction(index: number): void;

  /** WXML data & attributes for Root */
  rootProps: Record<string, any>;
  /** WXML data & attributes for Backdrop */
  backdropProps: Record<string, any>;
  /** WXML data & attributes for Content sheet */
  contentProps: Record<string, any>;
  /** Close trigger props */
  closeTriggerProps: Record<string, any>;
  /** Footer actions props */
  actionsProps: Record<string, any>;
}
