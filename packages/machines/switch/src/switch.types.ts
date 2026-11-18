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
import type { anatomy } from "./switch.anatomy";

export type SwitchState = "checked" | "unchecked";

export type SwitchColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info";

export type SwitchSize = "xs" | "sm" | "md" | "lg" | "xl";

export type SwitchAnatomyPart = AnatomyPartName<typeof anatomy>;
export type SwitchUI = ComponentUI<typeof anatomy>;
export type SwitchResolvedUI = ResolvedUI<typeof anatomy>;

export interface SwitchCheckedChangeDetails {
  checked: boolean;
}

export interface SwitchProps {
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
  /** Value submitted with the form when checked (defaults to 'on') */
  value?: string | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the switch is currently invalid */
  invalid?: boolean | null | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Controlled checked state */
  checked?: boolean | null | undefined;
  /** Default checked state for uncontrolled mode */
  defaultChecked?: boolean | undefined;
  /** Whether the switch is disabled */
  disabled?: boolean | undefined;
  /** Whether the switch is read-only */
  readOnly?: boolean | undefined;
  /** Whether the switch is required in a form */
  required?: boolean | undefined;
  /** Whether the switch is in loading state */
  loading?: boolean | undefined;
  /** Callback fired when checked state changes */
  onChange?: ((details: SwitchCheckedChangeDetails) => void) | undefined;
}

export interface SwitchResolvedProps extends SwitchProps {
  checked: boolean | null;
  defaultChecked: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean | null;
  loading: boolean;
  value: string;
  name: string;
  form: string;
}

export type SwitchEvent =
  | { type: "TOGGLE" }
  | { type: "SET_CHECKED"; checked: boolean }
  | { type: "RESET_VALUE" };

export interface SwitchContext {
  invalid: boolean;
}

export interface SwitchComputed {
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  isInvalid: boolean;

  isChecked: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInteractive: boolean;
}

export interface SwitchRefs {
  initialChecked?: boolean | undefined;
  formField?: BoundFormField | undefined;
}

export interface SwitchSchema extends MachineSchema {
  state: SwitchState;
  tag: "checked" | "unchecked" | "disabled" | "loading";
  event: SwitchEvent;
  props: SwitchResolvedProps;
  context: SwitchContext;
  computed: SwitchComputed;
  refs: SwitchRefs;
  action: string;
  effect: string;
  guard: string;
}

export type SwitchMachine = Machine<SwitchSchema>;
export type SwitchService = Service<SwitchSchema>;
export type SwitchParams = Params<SwitchSchema>;

export interface SwitchApi {
  /** Current machine state ('checked' | 'unchecked') */
  state: SwitchState;
  /** Current checked boolean */
  checked: boolean;
  /** Whether the field is disabled */
  disabled: boolean;
  /** Whether the field is read-only */
  readOnly: boolean;
  /** Whether the field is invalid */
  invalid: boolean;
  /** Set checked state programmatically */
  setChecked(checked: boolean): void;
  /** Toggle checked state */
  toggle(): void;
  /** Reset to initial checked state */
  resetChecked(): void;
  /** Tap interaction handler */
  handleTap(): void;
  /** Props for root container */
  rootProps: Record<string, any>;
  /** Props for switch base/track */
  baseProps: Record<string, any>;
  /** Props for sliding thumb */
  thumbProps: Record<string, any>;
  /** Props for label */
  labelProps: Record<string, any>;
  /** Props for description */
  descriptionProps: Record<string, any>;
}
