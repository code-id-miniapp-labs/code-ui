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
  /** Optional explicit Form EventBus */
  formBus?: EventBus<FormBusEvents> | undefined;
  /** Custom UI slot classes */
  ui?: SwitchUI | undefined;
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
  /** Semantic color variant */
  color?: SwitchColor | undefined;
  /** Size variant */
  size?: SwitchSize | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Form field wrapper size override */
  fieldSize?: SwitchSize | undefined;
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
  /** Label text */
  label?: string | undefined;
  /** Description text */
  description?: string | undefined;
  /** Icon class to display when checked */
  checkedIcon?: string | undefined;
  /** Icon class to display when unchecked */
  uncheckedIcon?: string | undefined;
  /** Custom loading icon class */
  loadingIcon?: string | undefined;
  /** Callback fired when checked state changes */
  onChange?: ((details: SwitchCheckedChangeDetails) => void) | undefined;
}

export type SwitchEvent =
  | { type: "TOGGLE" }
  | { type: "SET_CHECKED"; checked: boolean }
  | { type: "RESET_VALUE" };

export interface SwitchContext {
  disabled: boolean;
  readOnly: boolean;
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  fieldSize: SwitchSize | "";
  invalid: boolean;
  required: boolean;
  loading: boolean;
  color: SwitchColor;
  size: SwitchSize;
  value: string;
  name: string;
  form: string;
  label: string;
  description: string;
  checkedIcon: string;
  uncheckedIcon: string;
  loadingIcon: string;
  ui: SwitchUI;
}

export interface SwitchComputed {
  isChecked: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInteractive: boolean;
  effectiveSize: SwitchSize;
}

export interface SwitchRefs {
  initialChecked?: boolean | undefined;
  formField?: BoundFormField | undefined;
  currentFormBus?: EventBus<FormBusEvents> | undefined;
}

export interface SwitchSchema extends MachineSchema {
  state: SwitchState;
  tag: "checked" | "unchecked" | "disabled" | "loading";
  event: SwitchEvent;
  props: SwitchProps;
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
  /** Alias for checked */
  isChecked: boolean;
  /** Whether the switch can be interacted with */
  isInteractive: boolean;
  /** Whether the field is disabled */
  disabled: boolean;
  /** Whether the field is read-only */
  readOnly: boolean;
  /** Whether the switch is in loading state */
  loading: boolean;
  /** Whether the field is invalid */
  invalid: boolean;
  /** Whether the field is required */
  required: boolean;
  /** Effective size */
  size: SwitchSize;
  /** Visual color */
  color: SwitchColor;
  /** Set checked state programmatically */
  setChecked(checked: boolean): void;
  /** Toggle checked state */
  toggle(): void;
  /** Reset to initial checked state */
  resetChecked(): void;
  /** Tap event handler for miniapp */
  handleTap(e?: any): void;
  /** Props for root container */
  rootProps: Record<string, any>;
  /** Props for container slot */
  containerProps: Record<string, any>;
  /** Props for switch base/track */
  baseProps: Record<string, any>;
  /** Alias props for control/track */
  controlProps: Record<string, any>;
  /** Props for sliding thumb */
  thumbProps: Record<string, any>;
  /** Props for label */
  labelProps: Record<string, any>;
  /** Props for description */
  descriptionProps: Record<string, any>;
  /** Props for hidden input */
  hiddenInputProps: Record<string, any>;
}
