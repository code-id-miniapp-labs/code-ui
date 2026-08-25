import type { AnatomyPartName, ComponentUI, ResolvedUI } from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./button.anatomy";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonState = "idle" | "loading" | "success" | "error";

export type ButtonAnatomyPart = AnatomyPartName<typeof anatomy>;
export type ButtonUI = ComponentUI<typeof anatomy>;
export type ButtonResolvedUI = ResolvedUI<typeof anatomy>;


export interface ButtonProps {
  /** The unique id of the component */
  id?: string;
  /** Sub-element ids */
  ids?: Record<string, string>;
  /** The MiniApp component instance */
  component?: MiniAppComponent;
  /** Custom UI slot classes for button anatomy parts */
  ui?: ButtonUI;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size variant of the button */
  size?: ButtonSize;
  /** Whether to automatically handle async promise loading */
  loadingAuto?: boolean;
  /** Duration in ms to auto-reset from success or error back to idle */
  autoResetDuration?: number;
  /** Callback fired on button tap */
  onTap?: (event?: any) => void | Promise<any>;
  /** Callback fired on button click (for React / Web / Taro) */
  onClick?: (event?: any) => void | Promise<any>;
}

export type ButtonEvent =
  | { type: "TAP"; event?: any }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_DISABLED"; disabled: boolean }
  | { type: "RESOLVE" }
  | { type: "REJECT"; error?: any }
  | { type: "RESET" };

export interface ButtonContext {
  loading: boolean;
  disabled: boolean;
  variant: ButtonVariant;
  size: ButtonSize;
  ui: ButtonUI;
}


export interface ButtonComputed {
  isLoading: boolean;
  isDisabled: boolean;
  isInteractive: boolean;
}

export interface ButtonSchema extends MachineSchema {
  state: ButtonState;
  tag: "loading" | "disabled";
  event: ButtonEvent;
  props: ButtonProps;
  context: ButtonContext;
  computed: ButtonComputed;
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
  /** Visual variant */
  variant: ButtonVariant;
  /** Size */
  size: ButtonSize;
  /** Resolved UI class names for each button anatomy part */
  ui: Record<ButtonAnatomyPart, string>;
  /** Set loading state manually */
  setLoading(loading: boolean): void;

  /** Set disabled state manually */
  setDisabled(disabled: boolean): void;
  /** Dispatch tap event */
  handleTap(event?: any): void;

  /** WXML data & attributes for Root <button> */
  rootProps: Record<string, any>;
  /** WXML data & attributes for Spinner */
  spinnerProps: Record<string, any>;
  /** WXML data & attributes for Label text */
  labelProps: Record<string, any>;
  /** WXML data & attributes for Icon */
  iconProps: Record<string, any>;
}
