import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { anatomy } from "./modal.anatomy";

export type ModalState = "open" | "closed" | "closing";
export type ModalTag = "open" | "closed" | "closing";
export type ModalSize = "xs" | "sm" | "md" | "lg" | "xl";

export type ModalAnatomyPart = AnatomyPartName<typeof anatomy>;
export type ModalUI = ComponentUI<typeof anatomy>;
export type ModalResolvedUI = ResolvedUI<typeof anatomy>;

export interface ModalOpenChangeDetails {
  open: boolean;
}

export interface ModalCloseProps {
  icon?: string | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  size?: string | undefined;
  disabled?: boolean | undefined;
  ui?: Record<string, any> | undefined;
  className?: string | undefined;
}

export interface ModalProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Whether the modal is open (controlled) */
  open?: boolean | null | undefined;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean | undefined;
  /** Whether clicking the overlay closes the modal (default: true) */
  dismissible?: boolean | undefined;
  /** Alias for overlay-click dismissal (default: true) */
  closeOnBackdropClick?: boolean | undefined;
  /** Whether enter/leave transitions are animated (default: true) */
  transition?: boolean | undefined;
  /** Transition duration in ms (default: 300) */
  duration?: number | undefined;
  /** Callback fired when open state changes */
  onOpenChange?: ((details: ModalOpenChangeDetails) => void) | undefined;
  /** Callback fired when modal begins closing */
  onClose?: (() => void) | undefined;
  /** Callback fired when dismissal is prevented while dismissible is false */
  onClosePrevent?: (() => void) | undefined;
  /** Callback fired when enter transition starts */
  onEnter?: (() => void) | undefined;
  /** Callback fired after enter transition finishes */
  onAfterEnter?: (() => void) | undefined;
  /** Callback fired when leave transition starts */
  onLeave?: (() => void) | undefined;
  /** Callback fired after leave transition finishes */
  onAfterLeave?: (() => void) | undefined;
}

export interface ModalResolvedProps extends ModalProps {
  open: boolean | null;
  defaultOpen: boolean;
  dismissible: boolean;
  closeOnBackdropClick: boolean;
  transition: boolean;
  duration: number;
}

export type ModalEvent =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" }
  | { type: "TRIGGER.TAP" }
  | { type: "OVERLAY.TAP" }
  | { type: "CLOSE_TRIGGER.TAP" }
  | { type: "ANIMATION_END" }
  | { type: "KEYBOARD_CHANGE"; height: number };

export interface ModalContext {
  keyboardHeight: number;
}

export interface ModalComputed {
  isOpen: boolean;
  isVisible: boolean;
}

export type ModalAction =
  | "invokeOnOpen"
  | "invokeOnClose"
  | "invokeOnAfterLeave"
  | "invokeOnClosePrevent"
  | "setKeyboardHeight"
  | "resetKeyboardHeight";

export type ModalGuard = "cannotDismissOnOverlay" | "isInstantClose";

export type ModalEffect =
  | "waitForEnterAnimation"
  | "waitForCloseAnimation"
  | "listenKeyboardHeight";

export interface ModalSchema extends MachineSchema {
  state: ModalState;
  tag: ModalTag;
  event: ModalEvent;
  props: ModalResolvedProps;
  context: ModalContext;
  computed: ModalComputed;
  action: ModalAction;
  effect: ModalEffect;
  guard: ModalGuard;
}

export type ModalMachine = Machine<ModalSchema>;
export type ModalService = Service<ModalSchema>;
export type ModalParams = Params<ModalSchema>;

export interface ModalApi {
  /** Whether the modal is open */
  open: boolean;
  /** Whether the modal is mounted/visible (true during 'open' and 'closing') */
  visible: boolean;
  /** Current machine state ('open' | 'closed' | 'closing') */
  state: ModalState;
  /** Open or close the modal */
  setOpen(open: boolean): void;
  /** Open the modal */
  openModal(): void;
  /** Close the modal */
  closeModal(): void;
  /** Toggle the modal open/closed state */
  toggle(): void;

  /** WXML data & attributes for Root */
  rootProps: Record<string, any>;
  /** WXML data & attributes for Overlay */
  overlayProps: Record<string, any>;
  /** WXML data & attributes for Container */
  containerProps: Record<string, any>;
  /** WXML data & attributes for Content */
  contentProps: Record<string, any>;
  /** WXML data & attributes for Close Trigger */
  closeTriggerProps: Record<string, any>;
}
