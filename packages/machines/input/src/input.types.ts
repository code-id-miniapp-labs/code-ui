import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type {
  BoundFormField,
  FormHostContext,
  FormRule,
  FormValidateOn,
} from "@code-id-labs/form";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { anatomy } from "./input.anatomy";

export type InputState = "idle" | "focused";
export type InputType =
  | "text"
  | "number"
  | "idcard"
  | "digit"
  | "safe-password"
  | "nickname";
export type InputVariant = "outline" | "soft" | "subtle" | "ghost" | "none";
export type InputColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info";
export type InputSize = "xs" | "sm" | "md" | "lg" | "xl";

export type InputAnatomyPart = AnatomyPartName<typeof anatomy>;
export type InputUI = ComponentUI<typeof anatomy>;
export type InputResolvedUI = ResolvedUI<typeof anatomy>;

export interface InputValueChangeDetails {
  value: string;
}

export interface InputProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Field-level validation rules */
  rules?: FormRule[] | undefined;
  /** Optional explicit reactive form host */
  formContext?: FormHostContext | null | undefined;
  /** Optional target `<c-form>` id/name when multiple forms exist on the same Page */
  form?: string | undefined;
  /** Form field name for hidden input and Form registration */
  name?: string | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the input is currently invalid */
  invalid?: boolean | null | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Controlled value */
  value?: string | number | null | undefined;
  /** Default value */
  defaultValue?: string | number | null | undefined;
  /** Whether the input is disabled */
  disabled?: boolean | undefined;
  /** Whether the input is read-only */
  readOnly?: boolean | undefined;
  /** Whether to show a clear button when value is non-empty */
  clearable?: boolean | undefined;
  /** Whether to focus on mount */
  autoFocus?: boolean | undefined;
  /** Callback fired when value changes */
  onChange?: ((details: InputValueChangeDetails) => void) | undefined;
  /** Callback fired when input receives focus */
  onFocus?: ((details: { value: string }) => void) | undefined;
  /** Callback fired when input loses focus */
  onBlur?: ((details: { value: string }) => void) | undefined;
  /** Callback fired when keyboard confirm button is tapped */
  onConfirm?: ((details: { value: string }) => void) | undefined;
  /** Callback fired when clear button is tapped */
  onClear?: ((details?: Record<string, any>) => void) | undefined;
}

export type InputEvent =
  | { type: "INPUT.CHANGE"; value: string; cursor?: number | undefined }
  | { type: "INPUT.FOCUS" }
  | { type: "INPUT.BLUR" }
  | { type: "INPUT.CONFIRM"; value?: string | undefined }
  | { type: "INPUT.CLEAR" }
  | { type: "SET_VALUE"; value: string | number }
  | { type: "CLEAR_VALUE" }
  | { type: "RESET_VALUE" };

export interface InputContext {
  value: string;
  invalid: boolean;
}

export interface InputComputed {
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  isInvalid: boolean;

  isEmpty: boolean;
  isDisabled: boolean;
  isFilled: boolean;
  isClearable: boolean;
  isInteractive: boolean;
  isReadOnly: boolean;
}

export interface InputRefs {
  initialValue?: string | undefined;
  formField?: BoundFormField | undefined;
}

export type InputAction =
  | "setupFormField"
  | "cleanupFormField"
  | "handleFocus"
  | "handleBlur"
  | "handleConfirm"
  | "setValue"
  | "clearValue"
  | "resetValue";

export type InputGuard = "isInteractive";

type InputDefaultedKey =
  | "value"
  | "invalid"
  | "defaultValue"
  | "name"
  | "disabled"
  | "readOnly"
  | "clearable"
  | "autoFocus";

export type InputResolvedProps = Omit<InputProps, InputDefaultedKey> & {
  [K in InputDefaultedKey]-?: Exclude<InputProps[K], undefined>;
};

export interface InputSchema extends MachineSchema {
  state: InputState;
  tag: "focused" | "disabled" | "idle";
  event: InputEvent;
  props: InputResolvedProps;
  context: InputContext;
  computed: InputComputed;
  refs: InputRefs;
  action: InputAction;
  effect: string;
  guard: InputGuard;
}

export type InputMachine = Machine<InputSchema>;
export type InputService = Service<InputSchema>;
export type InputParams = Params<InputSchema>;

export interface InputApi {
  /** Current machine state ('idle' | 'focused') */
  state: InputState;
  /** Current string value */
  value: string;
  /** Whether input value is empty */
  isEmpty: boolean;
  /** Whether input has a non-empty value */
  isFilled: boolean;
  /** Whether the clear button is currently active and visible */
  isClearable: boolean;
  /** Whether the field is invalid (via Form validation or `invalid` prop) */
  invalid: boolean;
  /** Whether the field is disabled (via Form or direct prop) */
  disabled: boolean;
  /** Whether the field is read-only (via Form or direct prop) */
  readOnly: boolean;
  /** Set value programmatically */
  setValue(value: string | number): void;
  /** Clear value */
  clearValue(): void;
  /** Reset value back to initial/default value */
  resetValue(): void;
  /** Focus input */
  focus(): void;
  /** Blur input */
  blur(): void;
  /** Handle input value update */
  handleInput(value: string, cursor?: number): string | void;
  /** Handle focus interaction */
  handleFocus(): void;
  /** Handle blur interaction */
  handleBlur(): void;
  /** Handle confirm interaction */
  handleConfirm(value?: string): void;
  /** Handle clear interaction */
  handleClear(): void;
  /** Get props for root container */
  rootProps: Record<string, any>;
  /** Get props for input element */
  inputProps: Record<string, any>;
  /** Get props for hidden form input */
  hiddenInputProps: Record<string, any>;
}
