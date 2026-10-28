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
import type { anatomy } from "./pin-input.anatomy";

export type PinInputType = "numeric" | "alphanumeric" | "alphabetic";
export type PinInputSeparator = number | number[] | boolean;
export type PinInputState = "idle" | "focused";
export type PinInputVariant = "outline" | "soft" | "subtle" | "ghost" | "none";
export type PinInputColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info";
export type PinInputSize = "xs" | "sm" | "md" | "lg" | "xl";

export type PinInputAnatomyPart = AnatomyPartName<typeof anatomy>;
export type PinInputUI = ComponentUI<typeof anatomy>;
export type PinInputResolvedUI = ResolvedUI<typeof anatomy>;

export interface PinInputValueChangeDetails {
  value: string[];
  valueAsString: string;
}

export interface PinInputValueInvalidDetails {
  value: string;
  index: number;
}

export interface PinInputProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Optional explicit Form EventBus (defaults to inject(component, FormBusKey)) */
  formBus?: EventBus<FormBusEvents> | undefined;
  /** Custom UI slot classes */
  ui?: PinInputUI | undefined;
  /** Optional target `<c-form>` id/name when multiple forms exist on the same Page */
  form?: string | undefined;
  /** Form field name for hidden input and Form registration */
  name?: string | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the input is currently invalid */
  invalid?: boolean | null | undefined;
  /** Visual variant */
  variant?: PinInputVariant | undefined;
  /** Semantic color */
  color?: PinInputColor | undefined;
  /** Size variant */
  size?: PinInputSize | "" | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Form field wrapper size override */
  fieldSize?: PinInputSize | undefined;
  /** Highlight all inputs with color ring */
  highlight?: boolean | undefined;
  /** Number of inputs (PIN length) */
  length?: number | undefined;
  /** Controlled value array or string */
  value?: string[] | string | null | undefined;
  /** Default value array or string */
  defaultValue?: string[] | string | null | undefined;
  /** Type of input accepted */
  type?: PinInputType | undefined;
  /** Whether the inputs are masked (password mode) */
  mask?: boolean | undefined;
  /** Placeholder character for empty cells */
  placeholder?: string | undefined;
  /** Whether the component is disabled */
  disabled?: boolean | undefined;
  /** Whether the component is read-only */
  readOnly?: boolean | undefined;
  /** Whether one-time-code auto-fill is supported */
  otp?: boolean | undefined;
  /** Whether to focus the first input on mount */
  autoFocus?: boolean | undefined;
  /** Whether to blur the active input when all fields are filled */
  blurOnComplete?: boolean | undefined;
  /** Whether to select text on focus */
  selectOnFocus?: boolean | undefined;
  /**
   * - number: Insert separator after every Nth input (e.g. 3 for 123-456)
   * - number[]: Insert separator after specific input counts (e.g. [3])
   * - boolean: If true, defaults to inserting after length / 2
   */
  separator?: PinInputSeparator | undefined;
  /** The separator character (defaults to "-") */
  separatorChar?: string | undefined;
  /** Callback fired when value changes */
  onValueChange?: ((details: PinInputValueChangeDetails) => void) | undefined;
  /** Callback fired when all inputs are filled */
  onValueComplete?: ((details: PinInputValueChangeDetails) => void) | undefined;
  /** Callback fired when an invalid character is entered */
  onValueInvalid?: ((details: PinInputValueInvalidDetails) => void) | undefined;
}

export type PinInputEvent =
  | { type: "INPUT.CHANGE"; index: number; value: string }
  | { type: "INPUT.FOCUS"; index: number; force?: boolean | undefined }
  | { type: "INPUT.BLUR"; index?: number | undefined }
  | { type: "INPUT.CLEAR" }
  | { type: "INPUT.PASTE"; index: number; value: string }
  | { type: "SET_VALUE"; value: string[] | string }
  | { type: "CLEAR_VALUE" }
  | { type: "RESET_VALUE" };

export interface PinInputContext {
  length: number;
  value: string[];
  focusedIndex: number;
  variant: PinInputVariant;
  color: PinInputColor;
  size: PinInputSize;
  highlight: boolean;
  disabled: boolean;
  readOnly: boolean;
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  fieldSize: PinInputSize | "";
  invalid: boolean;
  mask: boolean;
  otp: boolean;
  type: PinInputType;
  placeholder: string;
  separator: PinInputSeparator;
  separatorChar: string;
  blurOnComplete: boolean;
  selectOnFocus: boolean;
  form: string;
  name: string;
  ui: PinInputUI;
}

export interface PinInputComputed {
  valueAsString: string;
  isValueComplete: boolean;
  isEmpty: boolean;
  isFilled: boolean;
  isDisabled: boolean;
  effectiveSize: PinInputSize;
  isInteractive: boolean;
  isReadOnly: boolean;
}

export interface PinInputRefs {
  prevValue?: string[] | undefined;
  initialValue?: string[] | undefined;
  formField?: BoundFormField | undefined;
  currentFormBus?: EventBus<FormBusEvents> | undefined;
  busDisposers?: Array<() => void> | undefined;
}

export interface PinInputSchema extends MachineSchema {
  state: PinInputState;
  tag: "focused" | "disabled" | "complete" | "idle";
  event: PinInputEvent;
  props: PinInputProps;
  context: PinInputContext;
  computed: PinInputComputed;
  refs: PinInputRefs;
  action: string;
  effect: string;
  guard: string;
}

export type PinInputMachine = Machine<PinInputSchema>;
export type PinInputService = Service<PinInputSchema>;
export type PinInputParams = Params<PinInputSchema>;

export interface PinInputCell {
  index: number;
  value: string;
  isFocused: boolean;
  hasSeparator: boolean;
  separatorChar: string;
  inputProps: Record<string, any>;
  separatorProps: Record<string, any>;
}

export interface PinInputApi {
  /** Current machine state ('idle' | 'focused') */
  state: PinInputState;
  /** Current array of character values */
  value: string[];
  /** Visual variant */
  variant: PinInputVariant;
  /** Semantic color */
  color: PinInputColor;
  /** Whether the input is highlighted */
  highlight: boolean;
  /** Combined value as string */
  valueAsString: string;
  /** Whether all inputs are filled */
  isValueComplete: boolean;
  /** Whether all inputs are empty */
  isEmpty: boolean;
  /** Whether at least one input has a value */
  isFilled: boolean;
  /** Whether the field is invalid (via Form validation or `invalid` prop) */
  invalid: boolean;
  /** Whether the field is disabled (via Form or direct prop) */
  disabled: boolean;
  /** Whether the field is read-only (via Form or direct prop) */
  readOnly: boolean;
  /** Effective size variant */
  size: PinInputSize;
  /** Index of currently focused input (-1 if none) */
  focusedIndex: number;
  /** List of cell descriptors ready for wx:for loop */
  inputs: PinInputCell[];
  /** Set value programmatically */
  setValue(value: string[] | string): void;
  /** Clear all values and focus first slot */
  clearValue(): void;
  /** Reset value back to initial/default value without focusing */
  resetValue(): void;
  /** Focus specific input cell */
  focus(index?: number): void;
  /** MiniProgram bindinput handler */
  handleInput(e: any): string | void;
  /** MiniProgram bindfocus handler */
  handleFocus(e: any): void;
  /** MiniProgram bindblur handler */
  handleBlur(e?: any): void;
  /** MiniProgram bindtap handler */
  handleTap?(e: any): void;
  /** Get props for indexed input element */
  getInputProps(index: number): Record<string, any>;
  /** Get props for root container */
  rootProps: Record<string, any>;
  /** Get props for control container */
  controlProps: Record<string, any>;
  /** Get props for label */
  labelProps: Record<string, any>;
  /** Get props for hidden form input */
  hiddenInputProps: Record<string, any>;
  /** Get props for separator after index */
  getSeparatorProps(index: number): Record<string, any>;
}
