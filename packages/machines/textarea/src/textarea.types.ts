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
import type { anatomy } from "./textarea.anatomy";

export type TextareaState = "idle" | "focused";
export type TextareaVariant = "outline" | "soft" | "subtle" | "ghost" | "none";
export type TextareaColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info";
export type TextareaSize = "xs" | "sm" | "md" | "lg" | "xl";

export type TextareaAnatomyPart = AnatomyPartName<typeof anatomy>;
export type TextareaUI = ComponentUI<typeof anatomy>;
export type TextareaResolvedUI = ResolvedUI<typeof anatomy>;

export interface TextareaValueChangeDetails {
  value: string;
}

export interface TextareaLineChangeDetails {
  height: number;
  heightRpx?: number | undefined;
  lineCount: number;
  lineHeight: number;
}

export interface TextareaProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Optional explicit Form EventBus */
  formBus?: EventBus<FormBusEvents> | undefined;
  /** Custom UI slot classes */
  ui?: TextareaUI | undefined;
  /** Optional target `<c-form>` id/name when multiple forms exist on the same Page */
  form?: string | undefined;
  /** Form field name for hidden input and Form registration */
  name?: string | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the textarea is currently invalid */
  invalid?: boolean | null | undefined;
  /** Visual variant */
  variant?: TextareaVariant | undefined;
  /** Semantic color */
  color?: TextareaColor | undefined;
  /** Size variant */
  size?: TextareaSize | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Form field wrapper size override */
  fieldSize?: TextareaSize | undefined;
  /** Highlight textarea with color ring */
  highlight?: boolean | undefined;
  /** Controlled value */
  value?: string | number | null | undefined;
  /** Default value */
  defaultValue?: string | number | null | undefined;
  /** Placeholder text */
  placeholder?: string | undefined;
  /** Placeholder CSS class */
  placeholderClass?: string | undefined;
  /** Placeholder inline styles */
  placeholderStyle?: string | undefined;
  /** Whether the textarea is disabled */
  disabled?: boolean | undefined;
  /** Whether the textarea is read-only */
  readOnly?: boolean | undefined;
  /** Whether to show a clear button when value is non-empty */
  clearable?: boolean | undefined;
  /** Custom clear icon class */
  clearIcon?: string | undefined;
  /** Whether textarea is in loading state */
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
  /** Whether height is auto computed based on content */
  autoHeight?: boolean | undefined;
  /** If the textarea is inside a scroll-view */
  fixed?: boolean | undefined;
  /** Maximum number of characters */
  maxlength?: number | undefined;
  /** Whether to show confirm bar above keyboard */
  showConfirmBar?: boolean | undefined;
  /** Distance between cursor and keyboard */
  cursorSpacing?: number | undefined;
  /** Keyboard confirm button type */
  confirmType?: "return" | "send" | "search" | "next" | "go" | "done" | undefined;
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
  /** Disable default padding */
  disableDefaultPadding?: boolean | undefined;
  /** Whether to show character counter */
  count?: boolean | undefined;
  /** Callback fired when value changes */
  onValueChange?: ((details: TextareaValueChangeDetails) => void) | undefined;
  /** Callback fired when line count/height changes */
  onLineChange?: ((details: TextareaLineChangeDetails) => void) | undefined;
}

export type TextareaEvent =
  | { type: "TEXTAREA.CHANGE"; value: string; cursor?: number | undefined }
  | { type: "TEXTAREA.FOCUS" }
  | { type: "TEXTAREA.BLUR" }
  | { type: "TEXTAREA.CONFIRM"; value?: string | undefined }
  | { type: "TEXTAREA.LINE_CHANGE"; details: TextareaLineChangeDetails }
  | { type: "TEXTAREA.CLEAR" }
  | { type: "SET_VALUE"; value: string | number }
  | { type: "CLEAR_VALUE" }
  | { type: "RESET_VALUE" };

export interface TextareaContext {
  value: string;
  variant: TextareaVariant;
  color: TextareaColor;
  size: TextareaSize;
  highlight: boolean;
  disabled: boolean;
  readOnly: boolean;
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  fieldSize: TextareaSize | "";
  invalid: boolean;
  placeholder: string;
  maxlength: number;
  autoHeight: boolean;
  clearable: boolean;
  clearIcon: string;
  loading: boolean;
  leading: boolean;
  trailing: boolean;
  leadingIcon: string;
  trailingIcon: string;
  count: boolean;
  form: string;
  name: string;
  ui: TextareaUI;
}

export interface TextareaComputed {
  isEmpty: boolean;
  isFilled: boolean;
  isClearable: boolean;
  characterCount: number;
}

export interface TextareaRefs {
  prevValue?: string | undefined;
  initialValue?: string | undefined;
  formField?: BoundFormField | undefined;
  currentFormBus?: EventBus<FormBusEvents> | undefined;
  busDisposers?: Array<() => void> | undefined;
}

export interface TextareaSchema extends MachineSchema {
  state: TextareaState;
  tag: "focused" | "disabled" | "idle";
  event: TextareaEvent;
  props: TextareaProps;
  context: TextareaContext;
  computed: TextareaComputed;
  refs: TextareaRefs;
  action: string;
  effect: string;
  guard: string;
}

export type TextareaMachine = Machine<TextareaSchema>;
export type TextareaService = Service<TextareaSchema>;
export type TextareaParams = Params<TextareaSchema>;

export interface TextareaApi {
  /** Current machine state ('idle' | 'focused') */
  state: TextareaState;
  /** Current string value */
  value: string;
  /** Visual variant */
  variant: TextareaVariant;
  /** Semantic color */
  color: TextareaColor;
  /** Whether the textarea is highlighted */
  highlight: boolean;
  /** Whether textarea value is empty */
  isEmpty: boolean;
  /** Whether textarea has a non-empty value */
  isFilled: boolean;
  /** Whether the clear button is currently active and visible */
  isClearable: boolean;
  /** Current character count */
  characterCount: number;
  /** Whether the field is invalid (via Form validation or `invalid` prop) */
  invalid: boolean;
  /** Whether the field is disabled (via Form or direct prop) */
  disabled: boolean;
  /** Whether the field is read-only (via Form or direct prop) */
  readOnly: boolean;
  /** Effective size variant */
  size: TextareaSize;
  /** Whether auto-height dynamic sizing is enabled */
  autoHeight: boolean;
  /** Set value programmatically */
  setValue(value: string | number): void;
  /** Clear value */
  clearValue(): void;
  /** Reset value back to initial/default value */
  resetValue(): void;
  /** Focus textarea */
  focus(): void;
  /** Blur textarea */
  blur(): void;
  /** MiniProgram bindinput handler */
  handleInput(e: any): string | void;
  /** MiniProgram bindfocus handler */
  handleFocus(e: any): void;
  /** MiniProgram bindblur handler */
  handleBlur(e?: any): void;
  /** MiniProgram bindconfirm handler */
  handleConfirm(e?: any): void;
  /** MiniProgram bindlinechange handler */
  handleLineChange(e?: any): void;
  /** Tap handler for clear button */
  handleClear(e?: any): void;
  /** Get props for root container */
  rootProps: Record<string, any>;
  /** Get props for textarea element */
  textareaProps: Record<string, any>;
  /** Alias for textareaProps for polymorphic form compatibility */
  inputProps: Record<string, any>;
  /** Get props for leading container */
  leadingProps: Record<string, any>;
  /** Get props for trailing container */
  trailingProps: Record<string, any>;
  /** Get props for clear button */
  clearButtonProps: Record<string, any>;
  /** Get props for character counter */
  countProps: Record<string, any>;
  /** Get props for hidden form input */
  hiddenInputProps: Record<string, any>;
}
