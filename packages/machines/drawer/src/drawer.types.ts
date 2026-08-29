import type { AnatomyPartName, ComponentUI, ResolvedUI } from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./drawer.anatomy";

export type Placement = "top" | "bottom" | "left" | "right";
export type DrawerState = "open" | "closed" | "closing" | "swiping";

export type DrawerAnatomyPart = AnatomyPartName<typeof anatomy>;
export type DrawerUI = ComponentUI<typeof anatomy>;
export type DrawerResolvedUI = ResolvedUI<typeof anatomy>;


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
  /** Custom UI slot classes for drawer anatomy parts */
  ui?: DrawerUI;
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
  /** Explicit transition duration in ms (auto-computed from CSS if omitted) */
  duration?: number;
}


export type DrawerEvent =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" }
  | { type: "BACKDROP.TAP" }
  | { type: "CLOSE_TRIGGER.TAP" }
  | { type: "SWIPE_START" }
  | { type: "SWIPE_END"; passed: boolean }
  | { type: "ANIMATION_END" }
  | { type: "KEYBOARD_CHANGE"; height: number };

export interface DrawerContext {
  open: boolean;
  keyboardHeight: number;
  ui: DrawerUI;
}

export interface DrawerComputed {
  isOpen: boolean;
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
  /** Drag distance threshold in px passed to WXS gesture handler */
  threshold: number;
  /** Close animation duration in ms — synced to WXS exit animation */
  duration: number;
  /** Resolved UI class names for each drawer anatomy part */
  ui: Record<DrawerAnatomyPart, string>;
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
  /** WXML data & attributes for Header */
  headerProps: Record<string, any>;
  /** WXML data & attributes for Body */
  bodyProps: Record<string, any>;
  /** WXML data & attributes for Footer */
  footerProps: Record<string, any>;
}

