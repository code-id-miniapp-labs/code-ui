import type { AnatomyPartName, ComponentUI } from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./toast.anatomy";

export type ToastMode = "default" | "native";

export type ToastColor =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "neutral"
  | (string & {});

export type ToastVariant =
  | "solid"
  | "outline"
  | "soft"
  | "subtle"
  | (string & {});

export type ToastOrientation = "horizontal" | "vertical";

export type ToastPlacement = "top" | "center" | "bottom";

export type ToastProgressPosition = "top" | "bottom";

export type ToastState = "open" | "paused" | "dismissing" | "closed";

export type ToastAnatomyPart = AnatomyPartName<typeof anatomy>;
export type ToastUI = ComponentUI<typeof anatomy>;

export interface ToastAction {
  label: string;
  onClick?: (() => void) | undefined;
  color?: string | undefined;
  variant?: string | undefined;
  id?: string | undefined;
}

export interface ToastProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Custom UI slot classes for toast anatomy parts */
  ui?: ToastUI | undefined;
  /** Display mode: default (Nuxt UI style) or native (iOS / Android style) */
  mode?: ToastMode | undefined;
  /** Color variant of the toast */
  color?: ToastColor | undefined;
  /** Style variant of the toast */
  variant?: ToastVariant | undefined;
  /** Layout orientation (horizontal or vertical) */
  orientation?: ToastOrientation | undefined;
  /** Target placement on screen */
  placement?: ToastPlacement | undefined;
  /** Toast title */
  title?: string | undefined;
  /** Toast description */
  description?: string | undefined;
  /** Custom icon name or path */
  icon?: string | undefined;
  /** Auto-dismiss duration in ms (0 = persistent) */
  duration?: number | undefined;
  /** Whether to show countdown progress bar in default mode */
  progress?: boolean | { color?: string } | undefined;
  /** Position of the progress bar in default mode ('top' | 'bottom') */
  progressPosition?: ToastProgressPosition | undefined;
  /** Controlled open state */
  open?: boolean | undefined;
  /** Default open state */
  defaultOpen?: boolean | undefined;
  /** Whether to show close button in default mode */
  close?: boolean | undefined;
  /** Custom close icon name */
  closeIcon?: string | undefined;
  /** Action buttons */
  actions?: ToastAction[] | undefined;
  /** Callback fired on open state change */
  onOpenChange?: ((details: { open: boolean; id?: string | undefined }) => void) | undefined;
  /** Callback fired when toast is dismissed */
  onDismiss?: ((details?: { id?: string | undefined }) => void) | undefined;
  /** Callback fired when an action button is tapped */
  onAction?:
    | ((details: { action: ToastAction; index: number; id?: string | undefined }) => void)
    | undefined;
}

export type ToastEvent =
  | { type: "DISMISS" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "ANIMATION_END" }
  | { type: "CONTROLLED.OPEN" }
  | { type: "CONTROLLED.CLOSE" }
  | { type: "TRIGGER_ACTION"; action: ToastAction; index: number };

export interface ToastContext {
  ui: ToastUI;
}

export interface ToastComputed {
  isOpen: boolean;
  isVisible: boolean;
  isPaused: boolean;
  isDismissing: boolean;
}

export interface ToastRefs {
  timer?: ReturnType<typeof setTimeout> | undefined;
  dismissTimer?: ReturnType<typeof setTimeout> | undefined;
  remainingTime?: number | undefined;
  startedAt?: number | undefined;
}

export interface ToastSchema extends MachineSchema {
  state: ToastState;
  tag: "open" | "paused" | "dismissing" | "closed";
  event: ToastEvent;
  props: ToastProps;
  context: ToastContext;
  computed: ToastComputed;
  refs: ToastRefs;
  action: string;
  effect: string;
  guard: string;
}

export type ToastMachine = Machine<ToastSchema>;
export type ToastService = Service<ToastSchema>;
export type ToastParams = Params<ToastSchema>;

export interface ToastApi {
  /** Current state of the toast */
  state: ToastState;
  /** Whether the toast is open */
  open: boolean;
  /** Whether the toast is visible (open or dismissing) */
  visible: boolean;
  /** Whether the toast is currently animating out */
  dismissing: boolean;
  /** Whether countdown is paused */
  paused: boolean;
  /** Actions array pre-computed for WXML rendering */
  actions: Array<{
    label: string;
    index: number;
    actionProps: Record<string, any>;
    color?: string | undefined;
    variant?: string | undefined;
  }>;

  /** Dismisses the toast */
  dismiss: () => void;
  /** Pauses the auto-dismiss timer */
  pause: () => void;
  /** Resumes the auto-dismiss timer */
  resume: () => void;
  /** Handles an action button tap */
  handleAction: (index: number) => void;

  rootProps: Record<string, any>;
  wrapperProps: Record<string, any>;
  titleProps: Record<string, any>;
  descriptionProps: Record<string, any>;
  iconProps: Record<string, any>;
  closeTriggerProps: Record<string, any>;
  progressProps: Record<string, any>;
}
