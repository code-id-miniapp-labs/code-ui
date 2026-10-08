import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./pin-input.anatomy";

export type PinInputType = "numeric" | "alphanumeric" | "alphabetic";
export type PinInputSeparator = number | number[] | boolean;
export type PinInputState = "idle" | "focused";

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
  id?: string;
  /** Sub-element ids */
  ids?: Record<string, any>;
  /** The MiniApp component instance */
  component?: MiniAppComponent;
  /** Custom UI slot classes */
  ui?: PinInputUI;
  /** Number of inputs (PIN length) */
  length?: number;
  /** Controlled value array */
  value?: string[];
  /** Default value array */
  defaultValue?: string[];
  /** Type of input accepted */
  type?: PinInputType;
  /** Whether the inputs are masked (password mode) */
  mask?: boolean;
  /** Placeholder character for empty cells */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether the component is read-only */
  readOnly?: boolean;
  /** Whether one-time-code auto-fill is supported */
  otp?: boolean;
  /** Whether to focus the first input on mount */
  autoFocus?: boolean;
  /** Whether to blur the active input when all fields are filled */
  blurOnComplete?: boolean;
  /** Whether to select text on focus */
  selectOnFocus?: boolean;
  /**
   * Nuxt UI-style separator configuration:
   * - number: Insert separator after every Nth input (e.g. 3 for 123-456)
   * - number[]: Insert separator after specific input counts (e.g. [3])
   * - boolean: If true, defaults to inserting after length / 2
   */
  separator?: PinInputSeparator;
  /** The separator character (defaults to "-") */
  separatorChar?: string;
  /** Callback fired when value changes */
  onValueChange?: (details: PinInputValueChangeDetails) => void;
  /** Callback fired when all inputs are filled */
  onValueComplete?: (details: PinInputValueChangeDetails) => void;
  /** Callback fired when an invalid character is entered */
  onValueInvalid?: (details: PinInputValueInvalidDetails) => void;
}

export type PinInputEvent =
  | { type: "INPUT.CHANGE"; index: number; value: string }
  | { type: "INPUT.FOCUS"; index: number }
  | { type: "INPUT.BLUR"; index?: number }
  | { type: "INPUT.CLEAR" }
  | { type: "INPUT.PASTE"; index: number; value: string }
  | { type: "SET_VALUE"; value: string[] | string }
  | { type: "CLEAR_VALUE" };

export interface PinInputContext {
  length: number;
  value: string[];
  focusedIndex: number;
  disabled: boolean;
  readOnly: boolean;
  mask: boolean;
  otp: boolean;
  type: PinInputType;
  placeholder: string;
  separator: PinInputSeparator;
  separatorChar: string;
  blurOnComplete: boolean;
  ui: PinInputUI;
}

export interface PinInputComputed {
  valueAsString: string;
  isValueComplete: boolean;
  isFilled: boolean;
}

export interface PinInputRefs {
  prevValue?: string[];
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
}

export interface PinInputApi {
  /** Current machine state ('idle' | 'focused') */
  state: PinInputState;
  /** Current array of character values */
  value: string[];
  /** Combined value as string */
  valueAsString: string;
  /** Whether all inputs are filled */
  isValueComplete: boolean;
  /** Whether at least one input has a value */
  isFilled: boolean;
  /** Index of currently focused input (-1 if none) */
  focusedIndex: number;
  /** List of cell descriptors ready for wx:for loop */
  inputs: PinInputCell[];
  /** Set value programmatically */
  setValue(value: string[] | string): void;
  /** Clear all values */
  clearValue(): void;
  /** Focus specific input cell */
  focus(index?: number): void;
  /** MiniProgram bindinput handler */
  handleInput(e: any): void;
  /** MiniProgram bindfocus handler */
  handleFocus(e: any): void;
  /** MiniProgram bindblur handler */
  handleBlur(e?: any): void;
  /** Get props for indexed input element */
  getInputProps(index: number): Record<string, any>;
  /** Get props for root container */
  rootProps: Record<string, any>;
  /** Get props for control container */
  controlProps: Record<string, any>;
  /** Get props for label */
  labelProps: Record<string, any>;
  /** Get props for separator after index */
  getSeparatorProps(index: number): Record<string, any>;
}
