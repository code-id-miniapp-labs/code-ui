import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./floating-menu.anatomy";

export type FloatingMenuState = "closed" | "open" | "closing";
export type FloatingMenuTag = "closed" | "open" | "closing";

export type FloatingSide = "bottom" | "top";
export type FloatingAlign = "start" | "center" | "end";
export type FloatingMatchWidth = boolean | "min" | "exact";
export type FloatingTriggerMode = "manual" | "tap";

export type FloatingMenuAnatomyPart = AnatomyPartName<typeof anatomy>;
export type FloatingMenuUI = ComponentUI<typeof anatomy>;
export type FloatingMenuResolvedUI = ResolvedUI<typeof anatomy>;

export interface FloatingRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface FloatingViewport {
  width: number;
  height: number;
  safeTop?: number | undefined;
  safeBottom?: number | undefined;
}

export interface FloatingContentSize {
  width: number;
  height: number;
}

export interface FloatingMenuContentConfig {
  side?: FloatingSide | undefined;
  align?: FloatingAlign | undefined;
  sideOffset?: number | undefined;
  alignOffset?: number | undefined;
  collisionPadding?: number | undefined;
  avoidCollisions?: boolean | undefined;
  matchTriggerWidth?: FloatingMatchWidth | undefined;
  maxHeight?: number | undefined;
}

export interface FloatingPositionResult {
  positioned: boolean;
  resolvedSide: FloatingSide;
  resolvedAlign: FloatingAlign;
  maxHeight: number;
  positionerStyle: string;
  contentStyle: string;
  arrowStyle: string;
}

export interface FloatingMenuOpenChangeDetails {
  open: boolean;
}

export interface FloatingMenuProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Controlled open state (`null` = uncontrolled) */
  open?: boolean | null | undefined;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean | undefined;
  /** Whether trigger interaction is disabled */
  disabled?: boolean | undefined;
  /** Whether tapping the backdrop closes the menu */
  closeOnBackdropClick?: boolean | undefined;
  /** Whether tapping the trigger slot toggles the menu automatically or is managed by parent */
  triggerMode?: FloatingTriggerMode | undefined;
  /** Whether to render inside `<root-portal>` */
  portal?: boolean | undefined;
  /** Whether to render a directional arrow */
  arrow?: boolean | undefined;
  /** Preferred side relative to trigger */
  side?: FloatingSide | undefined;
  /** Preferred alignment along the trigger edge */
  align?: FloatingAlign | undefined;
  /** Distance in px between trigger and menu */
  sideOffset?: number | undefined;
  /** Alignment offset in px */
  alignOffset?: number | undefined;
  /** Viewport edge padding in px */
  collisionPadding?: number | undefined;
  /** Flip or clamp to stay inside viewport */
  avoidCollisions?: boolean | undefined;
  /** Match trigger width (`true`/`"exact"`, `"min"`, or `false`) */
  matchTriggerWidth?: FloatingMatchWidth | undefined;
  /** Maximum height of floating menu content in px */
  maxHeight?: number | undefined;
  /** Close transition duration in ms */
  duration?: number | undefined;
  /** Callback fired when open state changes */
  onOpenChange?: ((details: FloatingMenuOpenChangeDetails) => void) | undefined;
  /** Callback fired when menu opens */
  onOpen?: (() => void) | undefined;
  /** Callback fired when menu closes */
  onClose?: (() => void) | undefined;
  /** Callback fired when backdrop is tapped */
  onBackdropTap?: (() => void) | undefined;
}

type FloatingMenuDefaultedKey =
  | "open"
  | "defaultOpen"
  | "disabled"
  | "closeOnBackdropClick"
  | "triggerMode"
  | "portal"
  | "arrow"
  | "side"
  | "align"
  | "sideOffset"
  | "alignOffset"
  | "collisionPadding"
  | "avoidCollisions"
  | "matchTriggerWidth"
  | "maxHeight"
  | "duration";

export type FloatingMenuResolvedProps = Omit<
  FloatingMenuProps,
  FloatingMenuDefaultedKey
> & {
  [K in FloatingMenuDefaultedKey]-?: Exclude<FloatingMenuProps[K], undefined>;
};

export type FloatingMenuEvent =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" }
  | { type: "TRIGGER.TAP" }
  | { type: "BACKDROP.TAP" }
  | { type: "REPOSITION" }
  | {
      type: "MEASURE.DONE";
      anchorRect: FloatingRect | null;
      viewport: FloatingViewport;
      contentSize?: FloatingContentSize | null | undefined;
    }
  | { type: "ANIMATION_END" };

export interface FloatingMenuContext {
  anchorRect: FloatingRect | null;
  contentSize: FloatingContentSize | null;
  viewport: FloatingViewport;
}

export interface FloatingMenuComputed {
  isOpen: boolean;
  isVisible: boolean;
  isDisabled: boolean;
  position: FloatingPositionResult;
}

export interface FloatingMenuRefs {
  measureToken: number;
}

export interface FloatingMenuSchema extends MachineSchema {
  state: FloatingMenuState;
  tag: FloatingMenuTag;
  event: FloatingMenuEvent;
  props: FloatingMenuResolvedProps;
  context: FloatingMenuContext;
  computed: FloatingMenuComputed;
  refs: FloatingMenuRefs;
  action: string;
  effect: string;
  guard: string;
}

export type FloatingMenuMachine = Machine<FloatingMenuSchema>;
export type FloatingMenuService = Service<FloatingMenuSchema>;
export type FloatingMenuParams = Params<FloatingMenuSchema>;

export interface FloatingMenuApi {
  state: FloatingMenuState;
  open: boolean;
  visible: boolean;
  positioned: boolean;
  resolvedSide: FloatingSide;
  resolvedAlign: FloatingAlign;
  maxHeight: number;
  positionerStyle: string;
  contentStyle: string;
  arrowStyle: string;

  setOpen(open: boolean): void;
  openMenu(): void;
  closeMenu(): void;
  toggle(): void;
  reposition(): void;
  handleTriggerTap(): void;
  handleBackdropTap(): void;

  rootProps: Record<string, any>;
  triggerProps: Record<string, any>;
  backdropProps: Record<string, any>;
  positionerProps: Record<string, any>;
  contentProps: Record<string, any>;
}
