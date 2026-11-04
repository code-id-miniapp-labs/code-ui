import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./pull-down-refresh.anatomy";

export type PullDownRefreshState =
  | "idle"
  | "pulling"
  | "armed"
  | "refreshing"
  | "success";

export type PullDownRefreshTag = PullDownRefreshState;

export type PullDownRefreshStatus = -1 | 0 | 1 | 2 | 3;

export type PullDownRefreshAnatomyPart = AnatomyPartName<typeof anatomy>;
export type PullDownRefreshUI = ComponentUI<typeof anatomy>;
export type PullDownRefreshResolvedUI = ResolvedUI<typeof anatomy>;

export interface PullDownRefreshChangeDetails {
  value: boolean;
}

export interface PullDownRefreshScrollDetails {
  scrollTop: number;
  scrollLeft: number;
}

export interface PullDownRefreshDragDetails {
  offset: number;
}

export interface PullDownRefreshRefreshDetails {
  /** Finish the refreshing state and show the success message */
  close: () => void;
  /** Keep refreshing until the promise settles */
  setPromise: (task: Promise<unknown>) => void;
}

export interface PullDownRefreshProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Custom UI slot classes for pull-down-refresh anatomy parts */
  ui?: PullDownRefreshUI | undefined;
  /** Whether pull-to-refresh is disabled */
  disabled?: boolean | undefined;
  /** Controlled refreshing state (`true` while refreshing) */
  value?: boolean | null | undefined;
  /** Initial refreshing state when uncontrolled */
  defaultValue?: boolean | undefined;
  /** Pull distance in px required to trigger a refresh */
  threshold?: number | undefined;
  /** Maximum pull distance in px */
  maxPullDistance?: number | undefined;
  /** How long the refreshing state is held before timing out (ms) */
  refreshTimeout?: number | undefined;
  /** How long the success message is shown before collapsing (ms) */
  successDuration?: number | undefined;
  /** Messages for pulling, armed, refreshing, and success states */
  loadingTexts?: string[] | undefined;
  /** Transition duration in ms for snap and collapse animations */
  duration?: number | undefined;
  /** Whether the scroll-view shows a scrollbar */
  showScrollbar?: boolean | undefined;
  /** Whether tapping the status bar / double tapping the title scrolls back to top */
  enableBackToTop?: boolean | undefined;
  /** An element id to scroll into view */
  scrollIntoView?: string | undefined;
  /** Distance from the top at which `scrolltoupper` fires */
  upperThreshold?: number | undefined;
  /** Distance from the bottom at which `scrolltolower` fires */
  lowerThreshold?: number | undefined;
  /** Whether scrolling changes are animated */
  scrollWithAnimation?: boolean | undefined;
  /** Custom loading Icon */
  loadingIcon?: string | undefined;
  /** Callback fired when the refreshing state changes */
  onChange?: ((details: PullDownRefreshChangeDetails) => void) | undefined;
  /**
   * Callback fired when the user releases past the refresh threshold.
   * Return a promise or call `setPromise` to keep refreshing until it settles,
   * or call `close` to finish manually.
   */
  onRefresh?:
    | ((details: PullDownRefreshRefreshDetails) => void | Promise<unknown>)
    | undefined;
  /** Callback fired when the refresh state times out */
  onTimeout?: (() => void) | undefined;
  /** Callback fired when the scroll-view scrolls */
  onScroll?: ((details: PullDownRefreshScrollDetails) => void) | undefined;
  /** Callback fired when the scroll-view reaches the top */
  onScrollToUpper?: (() => void) | undefined;
  /** Callback fired when the scroll-view reaches the bottom */
  onScrollToLower?: (() => void) | undefined;
  /** Callback fired when a pull gesture starts */
  onDragStart?: (() => void) | undefined;
  /** Callback fired while pulling */
  onDrag?: ((details: PullDownRefreshDragDetails) => void) | undefined;
  /** Callback fired when a pull gesture ends */
  onDragEnd?: ((details: PullDownRefreshDragDetails) => void) | undefined;
}

export type PullDownRefreshEvent =
  | { type: "DRAG_START" }
  | { type: "DRAG_MOVE"; offset: number }
  | { type: "DRAG_END"; offset: number }
  | {
      type: "SCROLL";
      scrollTop: number;
      scrollLeft: number;
    }
  | { type: "SCROLL_TO_UPPER" }
  | { type: "SCROLL_TO_LOWER" }
  | { type: "REFRESH" }
  | { type: "CLOSE" }
  | { type: "TIMEOUT" }
  | { type: "SUCCESS_TIMEOUT" }
  | { type: "CONTROLLED.REFRESH" }
  | { type: "CONTROLLED.CLOSE" };

export interface PullDownRefreshContext {
  offset: number;
  scrollTop: number;
}

export interface PullDownRefreshComputed {
  isDisabled: boolean;
  isPulling: boolean;
  isArmed: boolean;
  isRefreshing: boolean;
  isAtTop: boolean;
  canPull: boolean;
  barHeight: number;
  tipsHeight: number;
  status: PullDownRefreshStatus;
  statusKey: PullDownRefreshState;
  text: string;
}

export type PullDownRefreshAction =
  | "setOffsetFromEvent"
  | "resetOffset"
  | "setScrollTopFromEvent"
  | "resetScrollTop"
  | "emitRefresh"
  | "emitChangeFalse"
  | "invokeTimeout"
  | "invokeScroll"
  | "invokeScrollToUpper"
  | "invokeScrollToLower"
  | "invokeDragStart"
  | "invokeDrag"
  | "invokeDragEnd";

export type PullDownRefreshGuard =
  | "canPull"
  | "isNotRefreshing"
  | "reachedThreshold"
  | "belowThreshold";

export type PullDownRefreshEffect =
  | "waitForRefreshTimeout"
  | "waitForSuccessDuration";

export interface PullDownRefreshRefs {
  refreshTask: Promise<unknown> | undefined;
}

export interface PullDownRefreshSchema extends MachineSchema {
  state: PullDownRefreshState;
  tag: PullDownRefreshTag;
  event: PullDownRefreshEvent;
  props: PullDownRefreshProps;
  context: PullDownRefreshContext;
  computed: PullDownRefreshComputed;
  action: PullDownRefreshAction;
  guard: PullDownRefreshGuard;
  effect: PullDownRefreshEffect;
  refs: PullDownRefreshRefs;
}

export type PullDownRefreshMachine = Machine<PullDownRefreshSchema>;
export type PullDownRefreshService = Service<PullDownRefreshSchema>;
export type PullDownRefreshParams = Params<PullDownRefreshSchema>;

export interface PullDownRefreshApi {
  /** Current FSM state */
  state: PullDownRefreshState;
  /** Current normalized status key used by the theme */
  statusKey: PullDownRefreshState;
  /** Numeric status matching the index in `loadingTexts` (-1 when idle) */
  status: PullDownRefreshStatus;
  /** Current displaced content height in px */
  barHeight: number;
  /** Visible tips height in px */
  tipsHeight: number;
  /** Current tips text */
  text: string;
  /** Whether pull-to-refresh is disabled */
  disabled: boolean;
  /** Whether a pull gesture is currently active */
  pulling: boolean;
  /** Whether the pull distance has reached the refresh threshold */
  armed: boolean;
  /** Whether the component is refreshing */
  refreshing: boolean;
  /** Whether the scroll-view is at the top */
  atTop: boolean;
  /** Whether a new pull gesture may start */
  canPull: boolean;
  /** Pull distance required to trigger a refresh */
  threshold: number;
  /** Maximum pull distance */
  maxPullDistance: number;
  /** Collapse / snap animation duration in ms */
  duration: number;
  /** Precomputed inline style for the track */
  trackStyle: string;
  /** Precomputed inline style for the tips area */
  tipsStyle: string;
  /** Start refreshing programmatically */
  refresh(): void;
  /** Finish refreshing and show the success message before collapsing */
  close(): void;
  /** Handle scroll events from the scroll-view */
  handleScroll(event: any): void;
  /** Handle the scroll-view reaching the top */
  handleScrollToUpper(): void;
  /** Handle the scroll-view reaching the bottom */
  handleScrollToLower(): void;
  /** Handle pull gesture start from WXS */
  handleTouchStart(data?: Record<string, unknown>): void;
  /** Handle pull gesture movement from WXS */
  handleTouchMove(data?: { offset?: number }): void;
  /** Handle pull gesture end from WXS */
  handleTouchEnd(data?: { offset?: number }): void;
  /** Props for the scroll-view root */
  rootProps: Record<string, any>;
  /** Props for the optional header area */
  headerProps: Record<string, any>;
  /** Props for the displaced track */
  trackProps: Record<string, any>;
  /** Props for the tips area */
  tipsProps: Record<string, any>;
  /** Props for the loading indicator */
  indicatorProps: Record<string, any>;
  /** Props for the tips text */
  textProps: Record<string, any>;
  /** Props for the content area */
  contentProps: Record<string, any>;
}
