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

export interface CheckboxGroupChangePayload {
  value: string[];
  disabled: boolean;
  invalid: boolean;
  size: CheckboxSize;
  color: CheckboxColor;
  variant?: CheckboxVariant | string | undefined;
}

export interface CheckboxGroupBusEvents {
  "group:change": CheckboxGroupChangePayload;
  "checkbox:toggle": { value: string };
}

export type CheckboxAnatomyPart = AnatomyPartName<typeof anatomy>;
export type CheckboxUI = ComponentUI<typeof anatomy>;
export type CheckboxResolvedUI = ResolvedUI<typeof anatomy>;

export interface CheckboxCheckedChangeDetails {
  value?: any;
  checked: boolean;
}

export interface CheckboxProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Optional explicit Form EventBus */
  formBus?: EventBus<FormBusEvents> | undefined;
  /** Custom UI slot classes */
  ui?: CheckboxUI | undefined;
  /** Optional target `<c-form>` id/name when multiple forms exist on the same Page */
  form?: string | undefined;
  /** Optional Checkbox Group EventBus */
  groupBus?: EventBus<CheckboxGroupBusEvents> | undefined;
  /** Checkbox Group value when controlled by group */
  groupValue?: string[] | undefined;
  /** Checkbox Group disabled state */
  groupDisabled?: boolean | undefined;
  /** Checkbox Group invalid state */
  groupInvalid?: boolean | undefined;
  /** Checkbox Group color override */
  groupColor?: CheckboxColor | "" | undefined;
  /** Checkbox Group size override */
  groupSize?: CheckboxSize | "" | undefined;
  /** Checkbox Group variant override */
  groupVariant?: CheckboxVariant | string | undefined;
  /** Form field name for hidden input and Form registration */
  name?: string | undefined;
  /** Value submitted with the form when checked (defaults to 'on') */
  value?: string | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the checkbox is currently invalid */
  invalid?: boolean | null | undefined;
  /** Semantic color variant */
  color?: CheckboxColor | undefined;
  /** Size variant */
  size?: CheckboxSize | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Form field wrapper size override */
  fieldSize?: CheckboxSize | undefined;
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
  /** Label text */
  label?: string | undefined;
  /** Description text */
  description?: string | undefined;
  /** Icon name / class / path when checked (defaults to 'check') */
  icon?: string | undefined;
  /** Icon name / class / path when indeterminate (defaults to 'minus') */
  indeterminateIcon?: string | undefined;
  /** Callback fired when checked state changes */
  onCheckedChange?:
    | ((details: CheckboxCheckedChangeDetails) => void)
    | undefined;
  /** Alias callback fired when checked state changes */
  onChange?: ((details: CheckboxCheckedChangeDetails) => void) | undefined;
}

export type CheckboxEvent =
  | { type: "TOGGLE" }
  | { type: "CHECK" }
  | { type: "UNCHECK" }
  | { type: "SET_CHECKED"; checked: boolean }
  | { type: "SET_INDETERMINATE"; indeterminate: boolean }
  | { type: "RESET_VALUE" };

export interface CheckboxContext {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  readOnly: boolean;
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  fieldSize: CheckboxSize | "";
  groupValue: string[] | undefined;
  groupDisabled: boolean;
  groupInvalid: boolean;
  groupColor: CheckboxColor | "";
  groupSize: CheckboxSize | "";
  groupVariant: string;
  invalid: boolean;
  required: boolean;
  color: CheckboxColor;
  size: CheckboxSize;
  value: string;
  name: string;
  form: string;
  label: string;
  description: string;
  icon: string;
  indeterminateIcon: string;
  ui: CheckboxUI;
}

export interface CheckboxComputed {
  isChecked: boolean;
  isIndeterminate: boolean;
  isInteractive: boolean;
  isDisabled: boolean;
  isInvalid: boolean;
  effectiveSize: CheckboxSize;
  effectiveColor: CheckboxColor;
}

export interface CheckboxRefs {
  initialChecked?: boolean | undefined;
  initialIndeterminate?: boolean | undefined;
  prevControlledChecked?: boolean | undefined;
  prevControlledIndeterminate?: boolean | undefined;
  formField?: BoundFormField | undefined;
  currentFormBus?: EventBus<FormBusEvents> | undefined;
  currentGroupBus?: EventBus<CheckboxGroupBusEvents> | undefined;
  busDisposers?: Array<() => void> | undefined;
}

export interface CheckboxSchema extends MachineSchema {
  state: CheckboxState;
  tag: "checked" | "unchecked" | "indeterminate" | "disabled";
  event: CheckboxEvent;
  props: CheckboxProps;
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
  /** Alias for checked */
  isChecked: boolean;
  /** Whether the checkbox is indeterminate */
  indeterminate: boolean;
  /** Alias for indeterminate */
  isIndeterminate: boolean;
  /** Whether the checkbox can be interacted with */
  isInteractive: boolean;
  /** Whether the field is disabled */
  disabled: boolean;
  /** Whether the field is read-only */
  readOnly: boolean;
  /** Whether the field is invalid */
  invalid: boolean;
  /** Whether the field is required */
  required: boolean;
  /** Effective size */
  size: CheckboxSize;
  /** Visual color */
  color: CheckboxColor;
  /** Label text */
  label: string;
  /** Description text */
  description: string;
  /** Checked icon */
  icon: string;
  /** Indeterminate icon */
  indeterminateIcon: string;
  /** Set checked state programmatically */
  setChecked(checked: boolean): void;
  /** Set indeterminate state programmatically */
  setIndeterminate(indeterminate: boolean): void;
  /** Toggle checked state */
  toggle(): void;
  /** Reset to initial checked state */
  resetChecked(): void;
  /** Tap event handler for miniapp */
  handleTap(e?: any): void;
  /** Props for root container */
  rootProps: Record<string, any>;
  /** Props for checkbox base box */
  baseProps: Record<string, any>;
  /** Props for indicator */
  indicatorProps: Record<string, any>;
  /** Props for label */
  labelProps: Record<string, any>;
  /** Props for description */
  descriptionProps: Record<string, any>;
  /** Props for hidden input */
  hiddenInputProps: Record<string, any>;
}
