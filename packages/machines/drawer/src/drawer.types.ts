import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { anatomy } from "./drawer.anatomy";

export type Placement = "top" | "bottom" | "left" | "right";
export type DrawerState = "open" | "closed" | "closing" | "dragging";
export type DrawerTag = "open" | "closed" | "dragging" | "closing";

export type DrawerAnatomyPart = AnatomyPartName<typeof anatomy>;
export type DrawerUI = ComponentUI<typeof anatomy>;
export type DrawerResolvedUI = ResolvedUI<typeof anatomy>;

export interface OpenChangeDetails {
  open: boolean;
}

export interface DrawerCloseProps {
  icon?: string | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  size?: string | undefined;
  disabled?: boolean | undefined;
  ui?: Record<string, any> | undefined;
  className?: string | undefined;
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
  open?: boolean | null | undefined;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Callback fired when open state changes */
  onOpenChange?: (details: OpenChangeDetails) => void;
  /** Callback fired when drawer closes */
  onClose?: () => void;
  /** Callback fired when the backdrop is tapped */
  onBackdropTap?: (() => void) | undefined;
  /** Callback fired when the close trigger is tapped */
  onCloseTriggerTap?: (() => void) | undefined;
  /** Callback fired when a dismiss drag gesture begins */
  onDragStart?: ((details: { offset?: number | undefined }) => void) | undefined;
  /** Callback fired while dragging */
  onDrag?: ((details: { offset?: number | undefined }) => void) | undefined;
  /** Callback fired when a dismiss drag gesture ends */
  onDragEnd?:
    | ((details: { passed: boolean; offset?: number | undefined }) => void)
    | undefined;
  /** Whether clicking the backdrop closes the drawer */
  closeOnBackdropClick?: boolean;
  /** Whether the drawer can be dragged to close */
  dismissible?: boolean;
  /** Drag distance threshold in px to trigger close */
  threshold?: number;
  /** Explicit transition duration in ms (auto-computed from CSS if omitted) */
  duration?: number;
  /** Whether opening this drawer scales down the background (<c-app>) */
  shouldScaleBackground?: boolean;
  /** Scale factor when scaled (default: 0.94) */
  scaleFactor?: number;
  /** Background canvas color or class when scaled (default: "bg-black") */
  scaleBackground?: string;
}

export interface DrawerResolvedProps extends DrawerProps {
  open: boolean | null;
  defaultOpen: boolean;
  placement: Placement;
  closeOnBackdropClick: boolean;
  dismissible: boolean;
  threshold: number;
  duration: number;
  shouldScaleBackground: boolean;
  scaleFactor: number;
  scaleBackground: string;
}

export type DrawerEvent =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" }
  | { type: "BACKDROP.TAP" }
  | { type: "CLOSE_TRIGGER.TAP" }
  | { type: "DRAG_START"; data?: { offset?: number | undefined } | undefined }
  | { type: "DRAG_MOVE"; data?: { offset?: number | undefined } | undefined }
  | {
      type: "DRAG_END";
      passed: boolean;
      data?: { passed: boolean; offset?: number | undefined } | undefined;
    }
  | { type: "ANIMATION_END" }
  | { type: "KEYBOARD_CHANGE"; height: number };

export interface DrawerContext {
  keyboardHeight: number;
}

export interface DrawerComputed {
  isOpen: boolean;
  isVisible: boolean;
  placement: Placement;
}

export type DrawerAction =
  | "invokeOnOpen"
  | "invokeOnClose"
  | "invokeOnBackdropTap"
  | "invokeOnCloseTriggerTap"
  | "invokeOnDragStart"
  | "invokeOnDrag"
  | "invokeOnDragEnd"
  | "setKeyboardHeight"
  | "resetKeyboardHeight";

export type DrawerGuard =
  | "closeOnBackdropClick"
  | "isDismissible"
  | "dragPassed";

export type DrawerEffect = "waitForCloseAnimation" | "listenKeyboardHeight";

export interface DrawerSchema extends MachineSchema {
  state: DrawerState;
  tag: DrawerTag;
  event: DrawerEvent;
  props: DrawerResolvedProps;
  context: DrawerContext;
  computed: DrawerComputed;
  action: DrawerAction;
  effect: DrawerEffect;
  guard: DrawerGuard;
}

export type DrawerMachine = Machine<DrawerSchema>;
export type DrawerService = Service<DrawerSchema>;
export type DrawerParams = Params<DrawerSchema>;

export interface DrawerApi {
  /** Whether the drawer is open */
  open: boolean;
  /** Whether the drawer is mounted/visible (true during 'open', 'dragging', and 'closing') */
  visible: boolean;
  /** Current machine state ('open' | 'closed' | 'closing' | 'dragging') */
  state: DrawerState;
  /** Active virtual keyboard height in px (0 when closed) */
  keyboardHeight: number;
  /** Whether the virtual keyboard is currently open */
  keyboardOpen: boolean;
  /** Open or close the drawer */
  setOpen(open: boolean): void;
  /** Open the drawer */
  openDrawer(): void;
  /** Close the drawer */
  closeDrawer(): void;
  /** Handle backdrop tap */
  handleBackdropTap(): void;
  /** Handle close trigger tap */
  handleCloseTriggerTap(): void;
  /** Handle drag gesture start */
  handleDragStart(data?: { offset?: number | undefined }): void;
  /** Handle drag gesture move */
  handleDragMove(data?: { offset?: number | undefined }): void;
  /** Handle drag gesture end */
  handleDragEnd(
    passed: boolean,
    data?: { passed: boolean; offset?: number | undefined },
  ): void;

  /** WXML data & attributes for Root */
  rootProps: Record<string, any>;
  /** WXML data & attributes for Backdrop */
  backdropProps: Record<string, any>;
  /** WXML data & attributes for Content sheet */
  contentProps: Record<string, any>;
  /** WXML data & attributes for Close Trigger */
  closeTriggerProps: Record<string, any>;
}
