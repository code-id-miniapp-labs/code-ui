import type { AnatomyPartName, ComponentUI } from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./banner.anatomy";

export type BannerColor =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "danger"
  | "neutral"
  | (string & {});

export type BannerVariant =
  | "solid"
  | "outline"
  | "soft"
  | "subtle"
  | (string & {});

export type BannerSize = "xs" | "sm" | "md" | "lg" | "xl";

export type BannerPlacement = "top" | "bottom" | "inline";

export type BannerMode = "fixed" | "inline";

export type BannerImagePosition =
  | "none"
  | "left"
  | "right"
  | "background"
  | (string & {});

export type BannerImageShape = "square" | "rect" | (string & {});

export type BannerState = "open" | "dismissing" | "closed";

export type BannerAnatomyPart = AnatomyPartName<typeof anatomy>;
export type BannerUI = ComponentUI<typeof anatomy>;

export interface BannerAction {
  label: string;
  onClick?: (() => void) | undefined;
  icon?: string | undefined;
  loading?: boolean | undefined;
  loadingIcon?: string | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  size?: string | undefined;
  id?: string | undefined;
  closeOnClick?: boolean | undefined;
  ui?: any | undefined;
}

export interface BannerProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Custom UI slot classes for banner anatomy parts */
  ui?: BannerUI | undefined;
  /** Controlled open state */
  open?: boolean | undefined;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean | undefined;
  /** Color variant of the banner */
  color?: BannerColor | undefined;
  /** Style variant of the banner */
  variant?: BannerVariant | undefined;
  /** Size of the banner (LINE default or small) */
  size?: BannerSize | undefined;
  /** Screen or layout placement (top, bottom, inline) */
  placement?: BannerPlacement | undefined;
  /** Display mode (fixed or inline) */
  mode?: BannerMode | undefined;
  /** Banner primary title */
  title?: string | undefined;
  /** Banner description */
  description?: string | undefined;
  /** Small caption displayed above the title */
  caption?: string | undefined;
  /** Badge / label displayed above the title */
  badge?: string | undefined;
  /** Custom icon name or path */
  icon?: string | undefined;
  /** Custom icon name for info color */
  infoIcon?: string | undefined;
  /** Custom icon name for success color */
  successIcon?: string | undefined;
  /** Custom icon name for warning color */
  warningIcon?: string | undefined;
  /** Custom icon name for error / danger color */
  errorIcon?: string | undefined;
  /** Image source for the optional image area */
  image?: string | undefined;
  /** Image placement relative to the content area */
  imagePosition?: BannerImagePosition | undefined;
  /** Image box shape when placed beside the content */
  imageShape?: BannerImageShape | undefined;
  /** WeChat image mode (aspectFill, aspectFit, widthFix, ...) */
  imageMode?: string | undefined;
  /** Whether to show close button */
  close?: boolean | undefined;
  /** Alias for close (WeChat MiniProgram convention) */
  closable?: boolean | undefined;
  /** Custom close icon name */
  closeIcon?: string | undefined;
  /** Whether to show a more / link button */
  more?: boolean | undefined;
  /** Custom more icon name */
  moreIcon?: string | undefined;
  /** Action buttons */
  actions?: BannerAction[] | undefined;
  /** Native WeChat hover class applied to the root */
  hoverClass?: string | undefined;
  /** Manual top offset in px (overrides auto layout offset) */
  topOffset?: number | undefined;
  /** Manual bottom offset in px (overrides auto layout offset) */
  bottomOffset?: number | undefined;
  /** Whether to automatically coordinate with app layout insets */
  autoInset?: boolean | undefined;
  /** Callback fired when the banner is tapped */
  onTap?: ((details: { id?: string | undefined }) => void) | undefined;
  /** Callback fired on open state change */
  onOpenChange?:
    | ((details: { open: boolean; id?: string | undefined }) => void)
    | undefined;
  /** Callback fired when banner is dismissed */
  onDismiss?: ((details?: { id?: string | undefined }) => void) | undefined;
  /** Callback fired when an action button is tapped */
  onAction?:
    | ((details: {
        action: BannerAction;
        index: number;
        id?: string | undefined;
      }) => void)
    | undefined;
  /** Callback fired when the more button is tapped */
  onMore?: ((details: { id?: string | undefined }) => void) | undefined;
}

export type BannerEvent =
  | { type: "DISMISS" }
  | { type: "ANIMATION_END" }
  | { type: "MORE" }
  | { type: "TAP" }
  | { type: "TRIGGER_ACTION"; action: BannerAction; index: number };

export interface BannerContext {}

export interface BannerComputed {
  isOpen: boolean;
  isVisible: boolean;
  isDismissing: boolean;
}

export type BannerRefs = Record<string, never>;

export interface BannerSchema extends MachineSchema {
  state: BannerState;
  tag: "open" | "dismissing" | "closed";
  event: BannerEvent;
  props: BannerProps;
  context: BannerContext;
  computed: BannerComputed;
  refs: BannerRefs;
  action: string;
  effect: string;
  guard: string;
}

export type BannerMachine = Machine<BannerSchema>;
export type BannerService = Service<BannerSchema>;
export type BannerParams = Params<BannerSchema>;

export interface BannerApi {
  /** Current state of the banner */
  state: BannerState;
  /** Whether the banner is currently open */
  open: boolean;
  /** Whether the banner is visible (open or dismissing) */
  visible: boolean;
  /** Whether the banner is currently animating out */
  dismissing: boolean;
  /** Actions array pre-computed for WXML rendering */
  actions: Array<{
    label: string;
    index: number;
    icon?: string | undefined;
    loading: boolean;
    loadingIcon: string;
    color: string;
    variant: string;
    size: string;
    closeOnClick: boolean;
    ui?: any;
  }>;

  /** Dismisses the banner */
  dismiss: () => void;
  /** Handles an action button tap */
  handleAction: (index: number) => void;
  /** Handles the more button tap */
  handleMore: () => void;
  /** Handles a banner tap */
  handleTap: () => void;

  rootProps: Record<string, any>;
}
