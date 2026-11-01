import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./swipe-cell.anatomy";

export type SwipeSide = "left" | "right";
export type SwipeCellState = "closed" | "open" | "dragging";
export type SwipeCellTag = "closed" | "open" | "dragging";

export type SwipeCellAnatomyPart = AnatomyPartName<typeof anatomy>;
export type SwipeCellUI = ComponentUI<typeof anatomy>;
export type SwipeCellResolvedUI = ResolvedUI<typeof anatomy>;

export interface SwipeActionItem {
  value?: string | number | undefined;
  text?: string | undefined;
  icon?: string | undefined;
  className?: string | undefined;
  style?: string | undefined;
  color?: string | undefined;
  disabled?: boolean | undefined;
  onClick?: ((action: SwipeActionItem) => void) | undefined;
}

export interface SwipeCellActionSnapshot {
  index: number;
  side: SwipeSide;
  value?: string | number | undefined;
  text?: string | undefined;
  icon?: string | undefined;
  className?: string | undefined;
  style?: string | undefined;
  color?: string | undefined;
  disabled?: boolean | undefined;
  raw: SwipeActionItem;
}

export interface SwipeCellOpenChangeDetails {
  opened: boolean;
  side: SwipeSide | null;
}

export type OpenChangeDetails = SwipeCellOpenChangeDetails;

export interface SwipeCellActionClickDetails {
  action: SwipeActionItem;
  side: SwipeSide;
  index: number;
}

export type ActionClickDetails = SwipeCellActionClickDetails;

export type SwipeCellVariant =
  | "plain"
  | "outline"
  | "subtle"
  | "soft"
  | "separated";

export type SwipeCellSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SwipeCellProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Visual style variant */
  variant?: SwipeCellVariant | undefined;
  /** Size of swipe cell actions */
  size?: SwipeCellSize | undefined;
  /** Custom UI slot classes for swipe-cell anatomy parts */
  ui?: SwipeCellUI | undefined;
  /** Whether swipe cell interaction is disabled */
  disabled?: boolean | undefined;
  /** Controlled opened state: boolean, "left", "right", or null */
  opened?: SwipeSide | boolean | null | undefined;
  /** Initial opened state when uncontrolled */
  defaultOpened?: SwipeSide | boolean | undefined;
  /** Left action items array */
  left?: SwipeActionItem[] | undefined;
  /** Right action items array */
  right?: SwipeActionItem[] | undefined;
  /** Width in px for the left actions */
  leftWidth?: number | undefined;
  /** Width in px for the right actions */
  rightWidth?: number | undefined;
  /** Drag distance threshold in px to trigger open (default: 30) */
  threshold?: number | undefined;
  /** Explicit transition duration in ms (default: 300) */
  duration?: number | undefined;
  /** Whether clicking an action automatically closes the cell (default: true) */
  closeOnActionClick?: boolean | undefined;
  /** Whether clicking the cell content when open closes it (default: true) */
  closeOnContentClick?: boolean | undefined;
  /** Callback fired when opened state changes */
  onOpenChange?: ((details: OpenChangeDetails) => void) | undefined;
  /** Callback fired when swipe cell opens */
  onOpen?: ((details: { side: SwipeSide }) => void) | undefined;
  /** Callback fired when swipe cell closes */
  onClose?: (() => void) | undefined;
  /** Callback fired when an action item is clicked */
  onActionClick?: ((details: ActionClickDetails) => void) | undefined;
  /** Callback fired when an action item is clicked (alias) */
  onClick?: ((details: ActionClickDetails) => void) | undefined;
  /** Callback fired when drag starts */
  onDragStart?: ((data: Record<string, unknown>) => void) | undefined;
  /** Callback fired while dragging */
  onDrag?: ((data: { offset: number }) => void) | undefined;
  /** Callback fired when drag ends */
  onDragEnd?:
    | ((data: {
        opened: boolean;
        side: SwipeSide | null;
        offset: number;
      }) => void)
    | undefined;
  /** Callback fired when cell content is tapped */
  onContentTap?: (() => void) | undefined;
}

export type SwipeCellEvent =
  | { type: "CONTROLLED.OPEN"; side?: SwipeSide | undefined }
  | { type: "CONTROLLED.CLOSE" }
  | { type: "DRAG_START"; data?: Record<string, unknown> | undefined }
  | { type: "DRAG_MOVE"; offset: number }
  | { type: "DRAG_END"; opened: boolean; side: SwipeSide | null; offset: number }
  | { type: "OPEN"; side?: SwipeSide | undefined }
  | { type: "CLOSE" }
  | { type: "TOGGLE"; side?: SwipeSide | undefined }
  | {
      type: "ACTION_CLICK";
      action: SwipeActionItem;
      side: SwipeSide;
      index: number;
    }
  | { type: "CONTENT_TAP" }
  | { type: "MEASURE" }
  | {
      type: "SET_WIDTHS";
      leftWidth?: number | undefined;
      rightWidth?: number | undefined;
    };

export interface SwipeCellContext {
  openedSide: SwipeSide | null;
  leftWidth: number;
  rightWidth: number;
  currentOffset: number;
}

export interface SwipeCellComputed {
  isOpen: boolean;
  isClosed: boolean;
  isDragging: boolean;
  isDisabled: boolean;
  openedSide: SwipeSide | null;
  offset: number;
  hasLeftActions: boolean;
  hasRightActions: boolean;
}

export type SwipeCellAction =
  | "invokeOnOpen"
  | "invokeOnClose"
  | "emitChange"
  | "invokeOnActionClick"
  | "invokeOnDragStart"
  | "invokeOnDrag"
  | "invokeOnDragEnd"
  | "invokeOnContentTap"
  | "setOpenedSide"
  | "clearOpenedSide"
  | "setOpenedSideFromEvent"
  | "setWidths"
  | "measureWidths"
  | "setOffsetFromEvent";

export type SwipeCellGuard =
  | "isInteractive"
  | "closeOnContentClick"
  | "closeOnActionClick"
  | "isDragOpened"
  | "isDifferentSide";

export interface SwipeCellRefs {}

export interface SwipeCellSchema extends MachineSchema {
  state: SwipeCellState;
  tag: SwipeCellTag;
  event: SwipeCellEvent;
  props: SwipeCellProps;
  context: SwipeCellContext;
  computed: SwipeCellComputed;
  action: SwipeCellAction;
  guard: SwipeCellGuard;
  refs: SwipeCellRefs;
}

export type SwipeCellService = Service<SwipeCellSchema>;
export type SwipeCellMachine = Machine<SwipeCellSchema>;
export type SwipeCellParams = Params<SwipeCellSchema>;

export interface SwipeCellApi {
  /** Whether the cell is currently open */
  open: boolean;
  /** Current FSM state: "closed" | "open" | "dragging" */
  state: SwipeCellState;
  /** Currently opened side: "left" | "right" | null */
  openedSide: SwipeSide | null;
  /** Current sliding offset in px */
  offset: number;
  /** Visual style variant */
  variant: SwipeCellVariant;
  /** Size of swipe cell actions */
  size: SwipeCellSize;
  /** Whether the cell is disabled */
  disabled: boolean;
  /** Transition duration in ms */
  duration: number;
  /** Open threshold in px */
  threshold: number;
  /** Left action container width */
  leftWidth: number;
  /** Right action container width */
  rightWidth: number;
  /** Whether left actions are available */
  hasLeftActions: boolean;
  /** Whether right actions are available */
  hasRightActions: boolean;
  /** Precomputed left action items for WXML loop */
  leftActions: SwipeCellActionSnapshot[];
  /** Precomputed right action items for WXML loop */
  rightActions: SwipeCellActionSnapshot[];
  /** Open the cell on the specified side ("left" or "right", default "right") */
  openCell: (side?: SwipeSide) => void;
  /** Close the cell */
  closeCell: () => void;
  /** Toggle the cell open/closed state */
  toggleCell: (side?: SwipeSide) => void;
  /** Trigger measurement of action panel widths */
  measure: () => void;
  /** Handle touch/drag start from WXS or gesture system */
  handleTouchStart: (data?: Record<string, unknown>) => void;
  /** Handle touch/drag move from WXS or gesture system */
  handleTouchMove: (data?: { offset?: number; deltaX?: number }) => void;
  /** Handle touch/drag end from WXS or gesture system */
  handleTouchEnd: (data?: {
    opened: boolean;
    side: SwipeSide | null;
    offset: number;
  }) => void;
  /** Handle cell content tap */
  handleContentTap: () => void;
  /** Handle action button tap */
  handleActionTap: (
    e:
      | { side: SwipeSide; index: number }
      | {
          currentTarget?: {
            dataset?: { side?: SwipeSide; index?: number | string };
          };
        }
      | any,
  ) => void;
  /** Props for root container */
  rootProps: Record<string, unknown>;
  /** Props for sliding wrapper */
  wrapperProps: Record<string, unknown>;
  /** Props for left action container */
  leftProps: Record<string, unknown>;
  /** Props for main content container */
  contentProps: Record<string, unknown>;
  /** Props for right action container */
  rightProps: Record<string, unknown>;
  /** Precomputed inline transform style */
  contentStyle: string;
}
