import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type {
  Machine,
  MachineSchema,
  Params,
  Service,
} from "@code-id-labs/core";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { anatomy } from "./tour.anatomy";

export type TourState = "closed" | "open" | "closing";
export type TourTag = "closed" | "open" | "closing";

export type TourStepType = "tooltip" | "dialog" | "floating" | "wait";

export type TourPlacement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "right"
  | "center";

export type TourResolvedSide = "top" | "bottom" | "left" | "right" | "center";

export type TourStatus =
  | "idle"
  | "started"
  | "skipped"
  | "completed"
  | "dismissed"
  | "not-found";

export type TourStepActionType = "next" | "prev" | "dismiss" | "skip";

export type TourSize = "xs" | "sm" | "md" | "lg";

export type TourColor =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "neutral"
  | (string & {});

export type TourAnatomyPart = AnatomyPartName<typeof anatomy>;
export type TourUI = ComponentUI<typeof anatomy>;
export type TourResolvedUI = ResolvedUI<typeof anatomy>;

export interface TourRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface TourViewport {
  width: number;
  height: number;
  safeTop?: number | undefined;
  safeBottom?: number | undefined;
}

export interface TourContentSize {
  width: number;
  height: number;
}

export interface TourSpotlightResult {
  visible: boolean;
  rect: TourRect | null;
  spotlightStyle: string;
  backdropTopStyle: string;
  backdropBottomStyle: string;
  backdropLeftStyle: string;
  backdropRightStyle: string;
}

export interface TourPositionResult {
  positioned: boolean;
  resolvedSide: TourResolvedSide;
  showArrow: boolean;
  positionerStyle: string;
  arrowStyle: string;
}

export interface TourStepActionContext {
  next: () => void;
  prev: () => void;
  goTo: (stepIdOrIndex: string | number) => void;
  skip: () => void;
  dismiss: () => void;
  close: () => void;
  reposition: () => void;
  step: TourStepDetails | null;
  stepIndex: number;
  totalSteps: number;
}

export interface TourStepEffectArgs extends TourStepActionContext {
  /** Re-triggers layout measurement and refreshes spotlight/tooltip geometry */
  show: () => void;
}

export interface TourStepAction {
  /** Visible button label */
  label: string;
  /** Built-in tour command or custom handler */
  action: TourStepActionType | ((ctx: TourStepActionContext) => void);
  /** Optional button semantic color override */
  color?: string | undefined;
  /** Optional button variant override */
  variant?: string | undefined;
  /** Optional button size override */
  size?: string | undefined;
  /** Optional icon-only name */
  icon?: string | undefined;
  /** Optional leading icon name */
  leadingIcon?: string | undefined;
  /** Optional trailing icon name */
  trailingIcon?: string | undefined;
  /** Whether button is disabled */
  disabled?: boolean | undefined;
  /** Additional button attributes */
  attrs?: Record<string, any> | undefined;
}

export interface TourStepDetails {
  /** Unique identifier for the step */
  id: string;
  /** Presentation mode; defaults to "tooltip" when `target` is provided, otherwise "dialog" */
  type?: TourStepType | undefined;
  /**
   * Host page CSS selector (e.g. "#hero-cta", ".search-bar") or function
   * returning a selector to anchor and spotlight.
   */
  target?: string | (() => string | null | undefined) | undefined;
  /** Step heading text */
  title?: string | undefined;
  /** Step body description text */
  description?: string | undefined;
  /** Optional short badge/eyebrow label rendered above the title */
  badge?: string | undefined;
  /** Preferred placement relative to target (tooltip) or viewport (floating) */
  placement?: TourPlacement | undefined;
  /** Step action buttons; omit to use default Back / Next / Finish buttons */
  actions?: TourStepAction[] | undefined;
  /** Whether to show dimmed backdrop scrim for this step (default: true) */
  backdrop?: boolean | undefined;
  /** Whether to show directional arrow for tooltip steps (default: true for tooltip) */
  arrow?: boolean | undefined;
  /** Per-step spotlight padding override in px */
  spotlightOffset?: number | undefined;
  /** Per-step spotlight corner radius override in px (`null` = auto-detect from target) */
  spotlightRadius?: number | null | undefined;
  /** Per-step override to block interaction with the highlighted target */
  preventInteraction?: boolean | undefined;
  /** Arbitrary custom metadata */
  meta?: Record<string, any> | undefined;
  /**
   * Step-scoped side effect invoked when this step becomes active.
   * Return an optional cleanup function invoked when leaving the step or closing the tour.
   */
  effect?: ((args: TourStepEffectArgs) => void | (() => void)) | undefined;
}

export interface TourStepChangeDetails {
  stepId: string | null;
  stepIndex: number;
  totalSteps: number;
  step: TourStepDetails | null;
}

export interface TourStatusChangeDetails {
  status: TourStatus;
  stepId: string | null;
  stepIndex: number;
}

export interface TourOpenChangeDetails {
  open: boolean;
}

export interface TourCloseProps {
  icon?: string | undefined;
  leadingIcon?: string | undefined;
  trailingIcon?: string | undefined;
  label?: string | undefined;
  loading?: boolean | undefined;
  loadingIcon?: string | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  size?: string | undefined;
  disabled?: boolean | undefined;
  ui?: Record<string, any> | undefined;
  className?: string | undefined;
}

export interface TourProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element id overrides */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Optional custom selector query scope when targeting elements inside a custom component */
  targetScope?: MiniAppComponent | undefined;
  /** Ordered list of tour steps */
  steps?: TourStepDetails[] | undefined;
  /** Controlled active step id (`null` = uncontrolled) */
  stepId?: string | null | undefined;
  /** Initial step id when uncontrolled */
  defaultStepId?: string | null | undefined;
  /** Controlled open state (`null` = uncontrolled) */
  open?: boolean | null | undefined;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean | undefined;
  /** Whether tapping outside the tooltip/spotlight dismisses the tour */
  closeOnInteractOutside?: boolean | undefined;
  /** Whether to block taps on the highlighted target element */
  preventInteraction?: boolean | undefined;
  /** Padding around the highlighted target rect in px */
  spotlightOffset?: number | undefined;
  /**
   * Corner radius of the spotlight cutout in px.
   * When `null` (default), automatically detects the target element's computed `border-radius`
   * (producing `0` for square elements and a concentric curve for rounded elements).
   */
  spotlightRadius?: number | null | undefined;
  /** Gap in px between spotlight edge and tooltip card */
  sideOffset?: number | undefined;
  /** Minimum viewport margin in px */
  collisionPadding?: number | undefined;
  /** Whether to flip or clamp tooltip placement inside viewport */
  avoidCollisions?: boolean | undefined;
  /** Maximum card width in px (used for collision math and floating layout) */
  maxWidth?: number | undefined;
  /** Whether to scroll the page automatically so off-screen targets come into view */
  autoScroll?: boolean | undefined;
  /** Close transition duration in ms */
  duration?: number | undefined;
  /** Whether transitions are enabled */
  transition?: boolean | undefined;
  /** Optional custom formatter for progress text (default: `1 / 4`) */
  getProgressText?:
    | ((details: { stepIndex: number; totalSteps: number }) => string)
    | undefined;
  /** Callback fired when active step changes */
  onStepChange?: ((details: TourStepChangeDetails) => void) | undefined;
  /** Callback fired when tour lifecycle status changes */
  onStatusChange?: ((details: TourStatusChangeDetails) => void) | undefined;
  /** Callback fired when open state changes */
  onOpenChange?: ((details: TourOpenChangeDetails) => void) | undefined;
  /** Callback fired when tour opens */
  onOpen?: (() => void) | undefined;
  /** Callback fired when tour starts closing */
  onClose?: (() => void) | undefined;
  /** Callback fired after exit animation completes */
  onExitComplete?: (() => void) | undefined;
  /** Callback fired when backdrop scrim is tapped */
  onBackdropTap?: (() => void) | undefined;
  /** Callback fired when close trigger is tapped */
  onCloseTriggerTap?: (() => void) | undefined;
}

type TourDefaultedKey =
  | "steps"
  | "stepId"
  | "defaultStepId"
  | "open"
  | "defaultOpen"
  | "closeOnInteractOutside"
  | "preventInteraction"
  | "spotlightOffset"
  | "spotlightRadius"
  | "sideOffset"
  | "collisionPadding"
  | "avoidCollisions"
  | "maxWidth"
  | "autoScroll"
  | "duration"
  | "transition";

export type TourResolvedProps = Omit<TourProps, TourDefaultedKey> & {
  [K in TourDefaultedKey]-?: Exclude<TourProps[K], undefined>;
};

export type TourEvent =
  | { type: "START"; stepId?: string | undefined }
  | { type: "OPEN"; stepId?: string | undefined }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "GO_TO"; stepId?: string | undefined; stepIndex?: number | undefined }
  | { type: "SKIP" }
  | { type: "DISMISS" }
  | { type: "CLOSE" }
  | { type: "BACKDROP.TAP" }
  | { type: "CLOSE_TRIGGER.TAP" }
  | { type: "STEP.ACTION"; index: number }
  | { type: "REPOSITION" }
  | {
      type: "MEASURE.DONE";
      targetRect: TourRect | null;
      viewport: TourViewport;
      targetRadius?: number | null | undefined;
      contentSize?: TourContentSize | null | undefined;
      targetNotFound?: boolean | undefined;
    }
  | { type: "ANIMATION_END" };

export interface TourContext {
  stepId: string | null;
  status: TourStatus;
  targetRect: TourRect | null;
  targetRadius: number | null;
  contentSize: TourContentSize | null;
  viewport: TourViewport;
  measureResolved: boolean;
}

export interface TourComputed {
  isOpen: boolean;
  isVisible: boolean;
  totalSteps: number;
  stepIndex: number;
  step: TourStepDetails | null;
  stepType: TourStepType;
  hasNextStep: boolean;
  hasPrevStep: boolean;
  firstStep: boolean;
  lastStep: boolean;
  progressPercent: number;
  progressText: string;
  showBackdrop: boolean;
  preventInteraction: boolean;
  spotlight: TourSpotlightResult;
  position: TourPositionResult;
}

export interface TourRefs {
  measureToken: number;
  scrollTimer: ReturnType<typeof setTimeout> | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
  stepCleanup: (() => void) | null;
  activeEffectStepId: string | null;
}

export interface TourSchema extends MachineSchema {
  state: TourState;
  tag: TourTag;
  event: TourEvent;
  props: TourResolvedProps;
  context: TourContext;
  computed: TourComputed;
  refs: TourRefs;
  action: string;
  effect: string;
  guard: string;
}

export type TourMachine = Machine<TourSchema>;
export type TourService = Service<TourSchema>;
export type TourParams = Params<TourSchema>;

export interface TourApi {
  state: TourState;
  status: TourStatus;
  open: boolean;
  visible: boolean;
  step: TourStepDetails | null;
  stepId: string | null;
  stepIndex: number;
  totalSteps: number;
  stepType: TourStepType;
  hasNextStep: boolean;
  hasPrevStep: boolean;
  firstStep: boolean;
  lastStep: boolean;
  progressPercent: number;
  progressText: string;
  showBackdrop: boolean;
  showSpotlight: boolean;
  showCard: boolean;
  showArrow: boolean;
  preventInteraction: boolean;
  positioned: boolean;
  resolvedSide: TourResolvedSide;
  spotlightStyle: string;
  backdropTopStyle: string;
  backdropBottomStyle: string;
  backdropLeftStyle: string;
  backdropRightStyle: string;
  positionerStyle: string;
  arrowStyle: string;

  start(stepId?: string): void;
  setOpen(open: boolean): void;
  next(): void;
  prev(): void;
  goTo(stepIdOrIndex: string | number): void;
  skip(): void;
  dismiss(): void;
  close(): void;
  reposition(): void;
  handleBackdropTap(): void;
  handleCloseTriggerTap(): void;
  handleAction(index: number): void;

  rootProps: Record<string, any>;
  backdropProps: Record<string, any>;
  spotlightProps: Record<string, any>;
  positionerProps: Record<string, any>;
  contentProps: Record<string, any>;
  closeTriggerProps: Record<string, any>;
}
