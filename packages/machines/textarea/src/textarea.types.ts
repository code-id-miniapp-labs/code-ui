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
  /** Whether the textarea is currently invalid */
  invalid?: boolean | null | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Controlled value */
  value?: string | number | null | undefined;
  /** Default value */
  defaultValue?: string | number | null | undefined;
  /** Whether the textarea is disabled */
  disabled?: boolean | undefined;
  /** Whether the textarea is read-only */
  readOnly?: boolean | undefined;
  /** Whether to show a clear button when value is non-empty */
  clearable?: boolean | undefined;
  /** Whether to focus on mount */
  autoFocus?: boolean | undefined;
  /** Callback fired when value changes */
  onChange?: ((details: TextareaValueChangeDetails) => void) | undefined;
  /** Callback fired when textarea is focused */
  onFocus?: ((details: { value: string }) => void) | undefined;
  /** Callback fired when textarea loses focus */
  onBlur?: ((details: { value: string }) => void) | undefined;
  /** Callback fired when confirm button is tapped */
  onConfirm?: ((details: { value: string }) => void) | undefined;
  /** Callback fired when clear button is clicked */
  onClear?: ((details?: Record<string, any>) => void) | undefined;
  /** Callback fired when line count/height changes */
  onLineChange?: ((details: TextareaLineChangeDetails) => void) | undefined;
}

export type TextareaEvent =
  | { type: "TEXTAREA.CHANGE"; value: string; cursor?: number | undefined }
  | { type: "TEXTAREA.FOCUS"; programmatic?: boolean | undefined }
  | { type: "TEXTAREA.BLUR" }
  | { type: "TEXTAREA.CONFIRM"; value?: string | undefined }
  | {
      type: "TEXTAREA.LINE_CHANGE";
      detail: Partial<TextareaLineChangeDetails>;
    }
  | { type: "TEXTAREA.CLEAR" }
  | { type: "SET_VALUE"; value: string | number }
  | { type: "CLEAR_VALUE" }
  | { type: "RESET_VALUE" };

export interface TextareaContext {
  value: string;
  invalid: boolean;
  programmaticFocus: boolean;
}

export interface TextareaComputed {
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  isInvalid: boolean;

  isEmpty: boolean;
  isFilled: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInteractive: boolean;
  isClearable: boolean;
  characterCount: number;
}

export interface TextareaRefs {
  initialValue?: string | undefined;
  formField?: BoundFormField | undefined;
  cancelRefocus?: (() => void) | undefined;
}

type TextareaDefaultedKey =
  | "value"
  | "invalid"
  | "defaultValue"
  | "name"
  | "disabled"
  | "readOnly"
  | "clearable"
  | "autoFocus";

export type TextareaResolvedProps = Omit<
  TextareaProps,
  TextareaDefaultedKey
> & {
  [K in TextareaDefaultedKey]-?: Exclude<TextareaProps[K], undefined>;
};

export interface TextareaSchema extends MachineSchema {
  state: TextareaState;
  tag: "focused" | "disabled" | "idle";
  event: TextareaEvent;
  props: TextareaResolvedProps;
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
  /** Handle textarea value update */
  handleInput(value: string, cursor?: number): string | void;
  /** Handle focus interaction */
  handleFocus(): void;
  /** Handle blur interaction */
  handleBlur(): void;
  /** Handle confirm interaction */
  handleConfirm(value?: string): void;
  /** Handle linechange metrics */
  handleLineChange(detail: Partial<TextareaLineChangeDetails>): void;
  /** Handle clear interaction */
  handleClear(): void;
  /** Get props for root container */
  rootProps: Record<string, any>;
  /** Get props for textarea element */
  textareaProps: Record<string, any>;
  /** Alias for textareaProps for polymorphic form compatibility */
  inputProps: Record<string, any>;
  /** Get props for hidden form input */
  hiddenInputProps: Record<string, any>;
}
