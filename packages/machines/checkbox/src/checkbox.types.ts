import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type {
  BoundFormField,
  FormHostContext,
  FormRule,
  FormValidateOn,
} from "@code-ui/form";
import type { CheckboxGroupContext } from "@code-ui/checkbox-group";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./checkbox.anatomy";

export type CheckboxState = "checked" | "unchecked" | "indeterminate";

export type CheckboxCheckedState = boolean | "indeterminate";

export type CheckboxColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info"
  | (string & {});

export type CheckboxSize = "xs" | "sm" | "md" | "lg" | "xl";

export type CheckboxVariant = "outline" | "card";

export type CheckboxAnatomyPart = AnatomyPartName<typeof anatomy>;
export type CheckboxUI = ComponentUI<typeof anatomy>;
export type CheckboxResolvedUI = ResolvedUI<typeof anatomy>;

export interface CheckboxCheckedChangeDetails {
  value: string;
  checked: boolean;
}

export interface CheckboxProps {
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
  /** Live reactive state of the parent checkbox group */
  groupContext?: CheckboxGroupContext | undefined;
  /** Form field name for hidden input and Form registration */
  name?: string | undefined;
  /** Value submitted with the form when checked (defaults to 'on') */
  value?: string | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the checkbox is currently invalid */
  invalid?: boolean | null | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Controlled checked state */
  checked?: boolean | null | undefined;
  /** Default checked state for uncontrolled mode */
  defaultChecked?: boolean | undefined;
  /** Whether the checkbox is in an indeterminate state */
  indeterminate?: boolean | null | undefined;
  /** Default indeterminate state for uncontrolled mode */
  defaultIndeterminate?: boolean | undefined;
  /** Whether the checkbox is disabled */
  disabled?: boolean | undefined;
  /** Whether the checkbox is read-only */
  readOnly?: boolean | undefined;
  /** Whether the checkbox is required in a form */
  required?: boolean | undefined;
  /** Callback fired when checked state changes */
  onChange?: ((details: CheckboxCheckedChangeDetails) => void) | undefined;
}

export interface CheckboxResolvedProps extends CheckboxProps {
  checked: boolean | null;
  defaultChecked: boolean;
  indeterminate: boolean | null;
  defaultIndeterminate: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean | null;
  value: string;
  name: string;
  form: string;
}

export type CheckboxEvent =
  | { type: "TOGGLE" }
  | { type: "SET_CHECKED"; checked: boolean }
  | { type: "SET_INDETERMINATE"; indeterminate: boolean }
  | { type: "RESET_VALUE" };

export interface CheckboxContext {
  invalid: boolean;
}

export interface CheckboxComputed {
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;

  isChecked: boolean;
  isIndeterminate: boolean;
  isInteractive: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
  isReadOnly: boolean;
}

export interface CheckboxRefs {
  initialChecked?: boolean | undefined;
  initialIndeterminate?: boolean | undefined;
  lastChecked?: boolean | undefined;
  formField?: BoundFormField | undefined;
}

export interface CheckboxSchema extends MachineSchema {
  state: CheckboxState;
  tag: "checked" | "unchecked" | "indeterminate" | "disabled";
  event: CheckboxEvent;
  props: CheckboxResolvedProps;
  context: CheckboxContext;
  computed: CheckboxComputed;
  refs: CheckboxRefs;
  action: string;
  effect: string;
  guard: string;
}

export type CheckboxMachine = Machine<CheckboxSchema>;
export type CheckboxService = Service<CheckboxSchema>;
export type CheckboxParams = Params<CheckboxSchema>;

export interface CheckboxApi {
  /** Current machine state ('checked' | 'unchecked' | 'indeterminate') */
  state: CheckboxState;
  /** Current checked boolean */
  checked: boolean;
  /** Whether the checkbox is indeterminate */
  indeterminate: boolean;
  /** Whether the field is disabled */
  disabled: boolean;
  /** Whether the field is read-only */
  readOnly: boolean;
  /** Whether the field is invalid */
  invalid: boolean;
  /** Set checked state programmatically */
  setChecked(checked: boolean): void;
  /** Set indeterminate state programmatically */
  setIndeterminate(indeterminate: boolean): void;
  /** Toggle checked state */
  toggle(): void;
  /** Reset to initial checked state */
  resetChecked(): void;
  /** Tap interaction handler */
  handleTap(): void;
  /** Props for root container */
  rootProps: Record<string, any>;
  /** Props for checkbox base box */
  baseProps: Record<string, any>;
  /** Props for indicator */
  indicatorProps: Record<string, any>;
  /** Props for label */
  labelProps: Record<string, any>;
}
