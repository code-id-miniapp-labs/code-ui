import type { AnatomyPartName, ComponentUI } from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type { MiniAppComponent } from "@code-id-labs/utils";
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
  leadingIcon?: string | undefined;
  trailingIcon?: string | undefined;
  loading?: boolean | undefined;
  loadingIcon?: string | undefined;
  disabled?: boolean | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  size?: string | undefined;
  id?: string | undefined;
  closeOnClick?: boolean | undefined;
  ui?: any | undefined;
  className?: string | undefined;
}

export interface BannerButtonProps {
  label?: string | undefined;
  icon?: string | undefined;
  leadingIcon?: string | undefined;
  trailingIcon?: string | undefined;
  loading?: boolean | undefined;
  loadingIcon?: string | undefined;
  disabled?: boolean | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  size?: string | undefined;
  ui?: Record<string, any> | undefined;
  className?: string | undefined;
}

export type BannerBadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "neutral"
  | (string & {});

export type BannerBadgeVariant = "solid" | "outline" | "soft" | (string & {});

export type BannerBadgeSize = "xs" | "sm" | "md" | "lg" | "xl" | (string & {});

export interface BannerBadgeProps {
  label?: string | undefined;
  color?: BannerBadgeColor | undefined;
  variant?: BannerBadgeVariant | undefined;
  size?: BannerBadgeSize | undefined;
  ui?: Record<string, any> | undefined;
  className?: string | undefined;
}

export interface BannerProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Controlled open state */
  open?: boolean | null | undefined;
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean | undefined;
  /** Action buttons */
  actions?: BannerAction[] | undefined;
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
  | { type: "OPEN" }
  | { type: "DISMISS" }
  | { type: "ANIMATION_END" }
  | { type: "MORE" }
  | { type: "TAP" }
  | { type: "TRIGGER_ACTION"; index: number };

type BannerDefaultedKey = "open" | "defaultOpen" | "actions";

export type BannerResolvedProps = Omit<BannerProps, BannerDefaultedKey> & {
  [K in BannerDefaultedKey]-?: Exclude<BannerProps[K], undefined>;
};

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
  props: BannerResolvedProps;
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
