import type { AnatomyPartName, ComponentUI } from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./button.anatomy";

export interface ButtonTapDetail {
  x?: number | undefined;
  y?: number | undefined;
  promise?: Promise<any> | undefined;
  setPromise?: ((promise: Promise<any>) => void) | undefined;
  [key: string]: any;
}
export type ButtonVariant =
  | "solid"
  | "outline"
  | "ghost"
  | "soft"
  | "secondary"
  | (string & {});
export type ButtonColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info"
  | (string & {});
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | (string & {});
export type ButtonState = "idle" | "loading" | "success" | "error";

export type ButtonAnatomyPart = AnatomyPartName<typeof anatomy>;
export type ButtonUI = ComponentUI<typeof anatomy>;

export interface ButtonProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, string> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Whether the button is disabled */
  disabled?: boolean | undefined;
  /** Whether the button is in a loading state */
  loading?: boolean | undefined;
  /** Whether to automatically handle async promise loading */
  loadingAuto?: boolean | undefined;
  /** Duration in ms to auto-reset from success or error back to idle */
  autoResetDuration?: number | undefined;
  /** Callback fired on button tap */
  onTap?: ((detail?: ButtonTapDetail) => void | Promise<any>) | undefined;
}

export interface ButtonResolvedProps extends ButtonProps {
  disabled: boolean;
  loading: boolean;
  loadingAuto: boolean;
  autoResetDuration: number;
}

export type ButtonEvent =
  | { type: "TAP"; detail?: ButtonTapDetail | undefined }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_DISABLED"; disabled: boolean }
  | { type: "RESOLVE" }
  | { type: "REJECT"; error?: any }
  | { type: "RESET" };

export interface ButtonContext {
  loading: boolean;
  disabled: boolean;
  internalLoading: boolean;
}

export interface ButtonComputed {
  isLoading: boolean;
  isDisabled: boolean;
  isInteractive: boolean;
}

export interface ButtonRefs {}

export interface ButtonSchema extends MachineSchema {
  state: ButtonState;
  tag: "loading" | "disabled";
  event: ButtonEvent;
  props: ButtonResolvedProps;
  context: ButtonContext;
  computed: ButtonComputed;
  refs: ButtonRefs;
  action: string;
  effect: string;
  guard: string;
}

export type ButtonMachine = Machine<ButtonSchema>;
export type ButtonService = Service<ButtonSchema>;
export type ButtonParams = Params<ButtonSchema>;

export interface ButtonApi {
  /** Current machine state ('idle' | 'loading' | 'success' | 'error') */
  state: ButtonState;
  /** Whether the button is loading */
  loading: boolean;
  /** Whether the button is disabled */
  disabled: boolean;
  /** Set loading state manually */
  setLoading(loading: boolean): void;

  /** Set disabled state manually */
  setDisabled(disabled: boolean): void;
  /** Dispatch tap interaction */
  handleTap(detail?: ButtonTapDetail): void;

  /** WXML data & attributes for Root <button> */
  rootProps: Record<string, any>;
}
