import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { anatomy } from "./presence.anatomy";

export type PresenceState = "unmounted" | "open" | "exiting";
export type PresenceTag = "unmounted" | "closed" | "open" | "present" | "exiting" | "closing" | "mounted";
export type PresenceDataState = "open" | "closed";

export type PresenceAnatomyPart = AnatomyPartName<typeof anatomy>;
export type PresenceUI = ComponentUI<typeof anatomy>;
export type PresenceResolvedUI = ResolvedUI<typeof anatomy>;

export interface PresenceProps {
  /** Unique id for the presence root element */
  id?: string | undefined;
  /** Sub-element id overrides */
  ids?: Record<string, string> | undefined;
  /** MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Whether the element should be present/visible */
  present?: boolean | undefined;
  /** Defer mounting until `present` becomes true for the first time */
  lazyMount?: boolean | undefined;
  /** Unmount the element once exit animation completes */
  unmountOnExit?: boolean | undefined;
  /**
   * Explicit exit animation duration in ms.
   * Pass `0` for immediate unmount without animation.
   * When `null` / omitted, auto-queries CSS duration (falling back to 300ms)
   * and also listens for `ANIMATION_END` (e.g. `bindanimationend` / `bindtransitionend`).
   */
  duration?: number | null | undefined;
  /** Callback fired when exit animation completes and element settles to unmounted */
  onExitComplete?: (() => void) | undefined;
}

export interface PresenceResolvedProps extends PresenceProps {
  present: boolean;
  lazyMount: boolean;
  unmountOnExit: boolean;
  duration: number | null;
}

export type PresenceEvent =
  | { type: "PRESENT" }
  | { type: "OPEN" }
  | { type: "HIDE" }
  | { type: "CLOSE" }
  | { type: "ANIMATION_END" };

export interface PresenceContext {
  hasMountedOnce: boolean;
}

export interface PresenceComputed {
  isPresent: boolean;
  isExiting: boolean;
  isVisible: boolean;
  isMounted: boolean;
  dataState: PresenceDataState;
}

export type PresenceAction = "markMountedOnce" | "invokeOnExitComplete";

export type PresenceGuard = "isImmediateExit";

export type PresenceEffect = "waitForExitAnimation";

export interface PresenceSchema extends MachineSchema {
  state: PresenceState;
  tag: PresenceTag;
  event: PresenceEvent;
  props: PresenceResolvedProps;
  context: PresenceContext;
  computed: PresenceComputed;
  action: PresenceAction;
  effect: PresenceEffect;
  guard: PresenceGuard;
}

export type PresenceMachine = Machine<PresenceSchema>;
export type PresenceService = Service<PresenceSchema>;
export type PresenceParams = Params<PresenceSchema>;

export interface PresenceApi {
  /** Whether the element is logically present (`state === "open"`) */
  present: boolean;
  /** Whether the element is currently mounted in the tree */
  mounted: boolean;
  /** Whether the element is visible (`open` or `exiting`) */
  visible: boolean;
  /** Whether the element is currently playing its exit animation */
  exiting: boolean;
  /** Current FSM state (`"unmounted" | "open" | "exiting"`) */
  state: PresenceState;
  /** Attribute-friendly state (`"open" | "closed"`) for CSS transitions */
  dataState: PresenceDataState;
  /** Notify the machine that CSS animation/transition has ended */
  handleAnimationEnd(): void;
  /** Imperatively set presence state */
  setPresent(next: boolean): void;
  /** WXML attributes for Root */
  rootProps: Record<string, any>;
}
