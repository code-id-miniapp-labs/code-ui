import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { EventBus, MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./form.anatomy";

export type FormState =
  | "idle"
  | "validating"
  | "submitting"
  | "submitted"
  | "error";

export type FormValidateTrigger =
  | "input"
  | "change"
  | "blur"
  | "focus"
  | "submit";

export type FormValidateMode =
  | FormValidateTrigger
  | "lazy"
  | "eager"
  | `${FormValidateTrigger} lazy`;

export type FormValidateOn = FormValidateMode | FormValidateTrigger[];

export type FormRuleResult = boolean | string;

/**
 * Vuetify-inspired validation rule function.
 * Return `true` when valid, or an error string (or `false`) when invalid.
 * Supports both synchronous and asynchronous (`Promise`) results.
 */
export type FormRuleFn<T = any> = (
  value: T,
  values: Record<string, any>,
) => FormRuleResult | Promise<FormRuleResult>;

/**
 * Serializable validation rule descriptor for WXML `data` bindings.
 */
export interface FormRuleObject<T = any> {
  required?: boolean | undefined;
  minLength?: number | undefined;
  maxLength?: number | undefined;
  exactLength?: number | undefined;
  pattern?: RegExp | string | undefined;
  patternFlags?: string | undefined;
  email?: boolean | undefined;
  numeric?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  sameAs?: string | undefined;
  message?: string | undefined;
  validator?: FormRuleFn<T> | undefined;
}

export type FormRule<T = any> = FormRuleFn<T> | FormRuleObject<T>;

/**
 * Dictionary mapping field `name` to its active validation error messages.
 */
export type FormErrorBag = Record<string, string[]>;

/**
 * Structured validation error entry for a single field.
 */
export interface FormFieldError {
  name: string;
  id?: string | undefined;
  message: string;
  messages: string[];
}

export interface FormFieldValidationState {
  name: string;
  id: string;
  errors: string[];
  errorMessage: string;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isFocused: boolean;
  isValidating: boolean;
}

export interface FormFieldState extends FormFieldValidationState {
  value: any;
  initialValue: any;
}

export interface FormFieldRegistration {
  name: string;
  id: string;
  getValue: () => any;
  setValue?: ((value: any) => void) | undefined;
  resetValue?: (() => void) | undefined;
  focus?: (() => void) | undefined;
  getRules?: (() => FormRule[]) | undefined;
  getValidateOn?: (() => FormValidateOn | undefined) | undefined;
  isDisabled?: (() => boolean) | undefined;
  component?: MiniAppComponent | undefined;
  onValidationChange?: ((state: FormFieldValidationState) => void) | undefined;
  onFormStateChange?:
    | ((state: { disabled: boolean; readOnly: boolean }) => void)
    | undefined;
}

export interface FormValidationResult {
  valid: boolean;
  errors: FormFieldError[];
  errorBag: FormErrorBag;
  values: Record<string, any>;
}

export interface FormSubmitDetails {
  values: Record<string, any>;
  valid: boolean;
  errors: FormFieldError[];
  errorBag: FormErrorBag;
}

export interface FormErrorDetails {
  errors: FormFieldError[];
  errorBag: FormErrorBag;
  values: Record<string, any>;
}

export type FormBusEvents = {
  register: FormFieldRegistration;
  unregister: { name: string; id?: string | undefined };
  input: { name: string; value: any; id?: string | undefined };
  change: { name: string; value: any; id?: string | undefined };
  blur: { name: string; value?: any; id?: string | undefined };
  focus: { name: string; value?: any; id?: string | undefined };
  validate: { name?: string | undefined; result: FormValidationResult };
  reset: { name?: string | string[] | undefined };
  "clear-errors": { name?: string | string[] | undefined };
  submit: FormSubmitDetails;
  error: FormErrorDetails;
  "field:error": { name: string; errors: string[]; isValid: boolean };
  "field:rules": {
    name: string;
    getRules: () => FormRule[];
    required?: boolean | undefined;
  };
  "form:state": { disabled: boolean; readOnly: boolean };
  "field:state": {
    name: string;
    disabled?: boolean | undefined;
    size?: string | undefined;
  };
};

export type FormEventBus = EventBus<FormBusEvents>;

export type FormAnatomyPart = AnatomyPartName<typeof anatomy>;
export type FormUI = ComponentUI<typeof anatomy>;
export type FormResolvedUI = ResolvedUI<typeof anatomy>;

export interface FormProps {
  /** The unique id of the form component */
  id?: string | undefined;
  /** Optional form name / id used to scope field bindings when multiple `<c-form>` instances share a Page */
  name?: string | undefined;
  /** Custom element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Optional pre-created Form EventBus instance (injected/provided via @code-ui/context) */
  bus?: EventBus<FormBusEvents> | undefined;
  /** Custom UI slot classes */
  ui?: FormUI | undefined;
  /** Initial / controlled form values map */
  value?: Record<string, any> | undefined;
  /** Default form values map */
  defaultValue?: Record<string, any> | undefined;
  /** Form-level validation rules keyed by field name (merged with field-level `rules` prop) */
  rules?: Record<string, FormRule[]> | undefined;
  /**
   * Event triggers that run field validation.
   * Supports `'input' | 'change' | 'blur' | 'focus' | 'submit' | 'lazy' | 'eager'`
   * or an array of triggers.
   * @default ["input", "change", "blur"]
   */
  validateOn?: FormValidateOn | undefined;
  /**
   * When true, `input` and `change` triggers only validate a field after it has
   * been blurred/touched or after the first submit attempt (Vuetify lazy mode).
   * @default false
   */
  validateLazy?: boolean | undefined;
  /** Whether to focus the first invalid field automatically on failed submit */
  focusOnError?: boolean | undefined;
  /** Whether to scroll the page viewport to the first invalid field on failed submit */
  scrollToError?: boolean | undefined;
  /** Top offset (px) applied when scrolling to the first invalid field */
  scrollOffset?: number | undefined;
  /** Disable all fields inside the form */
  disabled?: boolean | undefined;
  /** Set all fields inside the form to read-only */
  readOnly?: boolean | undefined;
  /** Whether to render a built-in error summary list at the bottom of the form */
  showErrors?: boolean | undefined;
  /** Callback fired when form validation succeeds on submit */
  onSubmit?: ((details: FormSubmitDetails) => any) | undefined;
  /** Callback fired when form validation fails on submit */
  onError?: ((details: FormErrorDetails) => void) | undefined;
  /** Callback fired whenever any field value changes */
  onValueChange?: ((values: Record<string, any>) => void) | undefined;
  /** Callback fired when the form is reset */
  onReset?: (() => void) | undefined;
  /** Callback fired after validation runs */
  onValidate?: ((result: FormValidationResult) => void) | undefined;
}

export type FormEvent =
  | { type: "FIELD.REGISTER"; field: FormFieldRegistration }
  | { type: "FIELD.UNREGISTER"; name: string; id?: string | undefined }
  | {
      type: "FIELD.INPUT";
      name: string;
      value: any;
      id?: string | undefined;
    }
  | {
      type: "FIELD.CHANGE";
      name: string;
      value: any;
      id?: string | undefined;
    }
  | {
      type: "FIELD.BLUR";
      name: string;
      value?: any;
      id?: string | undefined;
    }
  | {
      type: "FIELD.FOCUS";
      name: string;
      value?: any;
      id?: string | undefined;
    }
  | {
      type: "VALIDATE";
      name?: string | string[] | undefined;
      resolve?: ((result: FormValidationResult) => void) | undefined;
    }
  | {
      type: "SUBMIT";
      resolve?: ((result: FormValidationResult) => void) | undefined;
    }
  | { type: "RESET"; name?: string | string[] | undefined }
  | { type: "RESET_VALIDATION"; name?: string | string[] | undefined }
  | {
      type: "SET_ERRORS";
      errors: FormErrorBag | Record<string, string | string[]> | FormFieldError[];
    }
  | { type: "SET_VALUES"; values: Record<string, any>; validate?: boolean | undefined }
  | {
      type: "SET_FIELD_VALUE";
      name: string;
      value: any;
      validate?: boolean | undefined;
    };

export interface FormContext {
  values: Record<string, any>;
  initialValues: Record<string, any>;
  errorBag: FormErrorBag;
  errors: FormFieldError[];
  fieldStates: Record<string, FormFieldState>;
  dirtyFields: string[];
  touchedFields: string[];
  validatingFields: string[];
  focusedField: string | null;
  submitCount: number;
  disabled: boolean;
  readOnly: boolean;
  focusOnError: boolean;
  scrollToError: boolean;
  scrollOffset: number;
  validateOn: FormValidateOn;
  validateLazy: boolean;
  showErrors: boolean;
  ui: FormUI;
}

export interface FormComputed {
  isValid: boolean;
  hasErrors: boolean;
  errorCount: number;
  isDirty: boolean;
  isTouched: boolean;
  isValidating: boolean;
  isSubmitting: boolean;
}

export interface FormRefs {
  bus: EventBus<FormBusEvents>;
  fields: Map<string, FormFieldRegistration>;
  fieldRules: Map<string, () => FormRule[]>;
  validationTokens: Map<string, number>;
  busDisposers: Array<() => void>;
}

export interface FormSchema extends MachineSchema {
  state: FormState;
  tag: "idle" | "validating" | "submitting" | "submitted" | "error";
  event: FormEvent;
  props: FormProps;
  context: FormContext;
  computed: FormComputed;
  refs: FormRefs;
  action: string;
  effect: string;
  guard: string;
}

export type FormMachine = Machine<FormSchema>;
export type FormService = Service<FormSchema>;
export type FormParams = Params<FormSchema>;

export interface FormErrorItemProps {
  name: string;
  message: string;
  messages: string[];
  errorProps: Record<string, any>;
}

export interface FormApi {
  /** Current form machine state */
  state: FormState;
  /** Map of current field values */
  values: Record<string, any>;
  /** Vuetify-style errorBag mapping field name -> string[] */
  errorBag: FormErrorBag;
  /** Flat list of active field errors */
  errors: FormFieldError[];
  /** Per-field validation and interaction state */
  fieldStates: Record<string, FormFieldState>;
  /** Pre-computed error items with DOM props for WXML wx:for rendering */
  errorItems: FormErrorItemProps[];
  /** True when the form has zero validation errors */
  isValid: boolean;
  /** True when at least one field has a validation error */
  hasErrors: boolean;
  /** Number of fields with errors */
  errorCount: number;
  /** True when any field value differs from its initial value */
  isDirty: boolean;
  /** True when any field has been blurred */
  isTouched: boolean;
  /** True while any async rule is running */
  isValidating: boolean;
  /** True while the form is submitting */
  isSubmitting: boolean;
  /** Number of times submit has been triggered */
  submitCount: number;
  /** Whether the form is disabled */
  disabled: boolean;
  /** Whether the form is read-only */
  readOnly: boolean;
  /** Underlying Form EventBus instance */
  bus: EventBus<FormBusEvents>;
  /** Validate all registered fields or specific field(s) */
  validate(name?: string | string[]): Promise<FormValidationResult>;
  /** Validate all fields, focus/scroll on error if invalid, or fire submit if valid */
  submit(): Promise<FormValidationResult>;
  /** Reset all fields (or specific field(s)) to initial values and clear errors */
  reset(name?: string | string[]): void;
  /** Clear validation errors without resetting field values */
  resetValidation(name?: string | string[]): void;
  /** Alias for resetValidation */
  clearErrors(name?: string | string[]): void;
  /** Manually set field errors (e.g., from server response) */
  setErrors(
    errors: FormErrorBag | Record<string, string | string[]> | FormFieldError[],
  ): void;
  /** Get active errors for a specific field or all fields */
  getErrors(name?: string): FormFieldError[];
  /** Get current values of all registered fields */
  getValues(): Record<string, any>;
  /** Get value of a specific field */
  getFieldValue(name: string): any;
  /** Set multiple field values programmatically */
  setValues(values: Record<string, any>, options?: { validate?: boolean }): void;
  /** Set a single field value programmatically */
  setFieldValue(
    name: string,
    value: any,
    options?: { validate?: boolean },
  ): void;
  /** Focus the first field that currently has a validation error */
  focusFirstError(): boolean;
  /** Scroll the viewport to the first field that currently has a validation error */
  scrollToFirstError(): Promise<boolean>;
  /** Native MiniApp bindsubmit handler */
  handleSubmit(e?: any): Promise<FormValidationResult>;
  /** Native MiniApp bindreset handler */
  handleReset(e?: any): void;
  /** Root container props */
  rootProps: Record<string, any>;
  /** Errors list container props */
  errorsProps: Record<string, any>;
  /** Individual field error props */
  getErrorProps(name: string): Record<string, any>;
}
