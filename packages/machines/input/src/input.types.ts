import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type {
  BoundFormField,
  FormBusEvents,
  FormValidateOn,
} from "@code-ui/form";
import type { EventBus, MiniAppComponent } from "@code-ui/utils";
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
  /** Optional explicit Form EventBus */
  formBus?: EventBus<FormBusEvents> | undefined;
  /** Custom UI slot classes */
  ui?: InputUI | undefined;
  /** Optional target `<c-form>` id/name when multiple forms exist on the same Page */
  form?: string | undefined;
  /** Form field name for hidden input and Form registration */
  name?: string | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the input is currently invalid */
  invalid?: boolean | undefined;
  /** Visual variant */
  variant?: InputVariant | undefined;
  /** Semantic color */
  color?: InputColor | undefined;
  /** Size variant */
  size?: InputSize | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Form field wrapper size override */
  fieldSize?: InputSize | undefined;
  /** Highlight input with color ring */
  highlight?: boolean | undefined;
  /** Controlled value */
  value?: string | number | null | undefined;
  /** Default value */
  defaultValue?: string | number | null | undefined;
  /** Type of input accepted */
  type?: InputType | undefined;
  /** Whether the input is masked (password mode) */
  password?: boolean | undefined;
  /** Placeholder text */
  placeholder?: string | undefined;
  /** Placeholder CSS class */
  placeholderClass?: string | undefined;
  /** Placeholder inline styles */
  placeholderStyle?: string | undefined;
  /** Whether the input is disabled */
  disabled?: boolean | undefined;
  /** Whether the input is read-only */
  readOnly?: boolean | undefined;
  /** Whether to show a clear button when value is non-empty */
  clearable?: boolean | undefined;
  /** Custom clear icon class */
  clearIcon?: string | undefined;
  /** Whether input is in loading state */
  loading?: boolean | undefined;
  /** Whether leading slot/icon is shown */
  leading?: boolean | undefined;
  /** Whether trailing slot/icon is shown */
  trailing?: boolean | undefined;
  /** Leading icon class */
  leadingIcon?: string | undefined;
  /** Trailing icon class */
  trailingIcon?: string | undefined;
  /** Whether to focus on mount */
  autoFocus?: boolean | undefined;
  /** Maximum number of characters */
  maxlength?: number | undefined;
  /** Distance between cursor and keyboard */
  cursorSpacing?: number | undefined;
  /** Keyboard confirm button type */
  confirmType?: "send" | "search" | "next" | "go" | "done" | undefined;
  /** Keep keyboard active on confirm */
  confirmHold?: boolean | undefined;
  /** Cursor position */
  cursor?: number | undefined;
  /** Selection start */
  selectionStart?: number | undefined;
  /** Selection end */
  selectionEnd?: number | undefined;
  /** Adjust position when keyboard appears */
  adjustPosition?: boolean | undefined;
  /** Hold keyboard */
  holdKeyboard?: boolean | undefined;
  /** Callback fired when value changes */
  onValueChange?: ((details: InputValueChangeDetails) => void) | undefined;
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
  disabled: boolean;
  readOnly: boolean;
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  fieldSize: InputSize | "";
  invalid: boolean;
  placeholder: string;
  type: InputType;
  password: boolean;
  maxlength: number;
  clearable: boolean;
  clearIcon: string;
  loading: boolean;
  leading: boolean;
  trailing: boolean;
  leadingIcon: string;
  trailingIcon: string;
  form: string;
  name: string;
  ui: InputUI;
}

export interface InputComputed {
  isFilled: boolean;
  isClearable: boolean;
}

export interface InputRefs {
  prevValue?: string | undefined;
  initialValue?: string | undefined;
  formField?: BoundFormField | undefined;
  currentFormBus?: EventBus<FormBusEvents> | undefined;
  busDisposers?: Array<() => void> | undefined;
}

export interface InputSchema extends MachineSchema {
  state: InputState;
  tag: "focused" | "disabled" | "idle";
  event: InputEvent;
  props: InputProps;
  context: InputContext;
  computed: InputComputed;
  refs: InputRefs;
  action: string;
  effect: string;
  guard: string;
}

export type InputMachine = Machine<InputSchema>;
export type InputService = Service<InputSchema>;
export type InputParams = Params<InputSchema>;

export interface InputApi {
  /** Current machine state ('idle' | 'focused') */
  state: InputState;
  /** Current string value */
  value: string;
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
  /** Effective size variant */
  size: InputSize;
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
  /** MiniProgram bindinput handler */
  handleInput(e: any): string | void;
  /** MiniProgram bindfocus handler */
  handleFocus(e: any): void;
  /** MiniProgram bindblur handler */
  handleBlur(e?: any): void;
  /** MiniProgram bindconfirm handler */
  handleConfirm(e?: any): void;
  /** Tap handler for clear button */
  handleClear(e?: any): void;
  /** Get props for root container */
  rootProps: Record<string, any>;
  /** Get props for input element */
  inputProps: Record<string, any>;
  /** Get props for leading container */
  leadingProps: Record<string, any>;
  /** Get props for trailing container */
  trailingProps: Record<string, any>;
  /** Get props for clear button */
  clearButtonProps: Record<string, any>;
  /** Get props for hidden form input */
  hiddenInputProps: Record<string, any>;
}
