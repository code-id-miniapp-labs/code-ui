import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";

export type Placement = "top" | "bottom" | "left" | "right";
export type DrawerState = "open" | "closed" | "closing" | "swiping";

export interface OpenChangeDetails {
  open: boolean;
}

export interface DrawerProps {
  /** The unique id of the component */
  id?: string;
  /** Sub-element ids */
  ids?: Record<string, string>;
  /** The MiniApp component instance */
  component?: MiniAppComponent;
  /** Placement direction of the drawer sheet */
  placement?: Placement;
  /** Whether the drawer is open (controlled) */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Callback fired when open state changes */
  onOpenChange?: (details: OpenChangeDetails) => void;
  /** Callback fired when drawer closes */
  onClose?: () => void;
  /** Whether clicking the backdrop closes the drawer */
  closeOnBackdropClick?: boolean;
  /** Whether the drawer can be swiped to close */
  dismissible?: boolean;
  /** Drag distance threshold in px to trigger close */
  threshold?: number;
}

export type DrawerEvent =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" }
  | { type: "BACKDROP.TAP" }
  | { type: "CLOSE_TRIGGER.TAP" }
  | { type: "SWIPE_START"; point: { x: number; y: number } }
  | { type: "SWIPE_MOVE"; point: { x: number; y: number } }
  | { type: "SWIPE_END" }
  | { type: "ANIMATION_END" }
  | { type: "KEYBOARD_CHANGE"; height: number };

export interface DrawerContext {
  open: boolean;
  dragOffset: number;
  startPoint: { x: number; y: number } | null;
  keyboardHeight: number;
}

export interface DrawerComputed {
  isOpen: boolean;
  isDragging: boolean;
  placement: Placement;
}

export interface DrawerSchema extends MachineSchema {
  state: DrawerState;
  tag: "open" | "closed" | "swiping";
  event: DrawerEvent;
  props: DrawerProps;
  context: DrawerContext;
  computed: DrawerComputed;
  action: string;
  effect: string;
  guard: string;
}

export type DrawerMachine = Machine<DrawerSchema>;
export type DrawerService = Service<DrawerSchema>;
export type DrawerParams = Params<DrawerSchema>;

export interface DrawerApi {
  /** Whether the drawer is open */
  open: boolean;
  /** Current machine state ('open' | 'closed' | 'closing' | 'swiping') */
  state: DrawerState;
  /** Placement ('bottom' | 'top' | 'left' | 'right') */
  placement: Placement;
  /** Whether user is actively swiping */
  dragging: boolean;
  /** Current drag offset in px */
  dragOffset: number;
  /** Open or close the drawer */
  setOpen(open: boolean): void;
  /** Open the drawer */
  openDrawer(): void;
  /** Close the drawer */
  closeDrawer(): void;

  /** WXML data & attributes for Root */
  rootProps: Record<string, any>;
  /** WXML data & attributes for Backdrop */
  backdropProps: Record<string, any>;
  /** WXML data & attributes for Content sheet */
  contentProps: Record<string, any>;
  /** WXML data & attributes for Grabber handle */
  grabberProps: Record<string, any>;
  /** WXML data & attributes for Close Trigger */
  closeTriggerProps: Record<string, any>;
}
