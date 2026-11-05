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
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./radio-group.anatomy";

export type RadioGroupState = "idle";

export type RadioGroupColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info";

export type RadioGroupSize = "xs" | "sm" | "md" | "lg" | "xl";

export type RadioGroupOrientation = "horizontal" | "vertical";

export type RadioGroupVariant = "outline" | "card";

export type RadioGroupAnatomyPart = AnatomyPartName<typeof anatomy>;
export type RadioGroupUI = ComponentUI<typeof anatomy>;
export type RadioGroupResolvedUI = ResolvedUI<typeof anatomy>;

export interface RadioGroupValueChangeDetails {
  value: string;
}

export interface RadioGroupItemRaw {
  value: string;
  label?: string | undefined;
  description?: string | undefined;
  disabled?: boolean | undefined;
  [key: string]: any;
}

export interface RadioGroupItem {
  value: string;
  label: string;
  description: string;
  disabled: boolean;
  checked: boolean;
  color?: RadioGroupColor | undefined;
  variant?: RadioGroupVariant | undefined;
  ui?: Record<string, any> | undefined;
  itemProps: Record<string, any>;
  controlProps: Record<string, any>;
  indicatorProps: Record<string, any>;
}

export interface RadioGroupProps {
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
  /** Custom UI slot classes */
  ui?: RadioGroupUI | undefined;
  /** Optional target `<c-form>` id/name when multiple forms exist on the same Page */
  form?: string | undefined;
  /** Form field name for hidden input and Form registration */
  name?: string | undefined;
  /** Controlled selected value */
  value?: string | null | undefined;
  /** Default selected value for uncontrolled mode */
  defaultValue?: string | null | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the radio group is currently invalid */
  invalid?: boolean | null | undefined;
  /** Semantic color variant */
  color?: RadioGroupColor | undefined;
  /** Size variant */
  size?: RadioGroupSize | undefined;
  /** Layout orientation */
  orientation?: RadioGroupOrientation | undefined;
  /** Visual variant (outline or card) */
  variant?: RadioGroupVariant | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Form field wrapper size override */
  fieldSize?: RadioGroupSize | undefined;
  /** Whether the entire radio group is disabled */
  disabled?: boolean | undefined;
  /** Whether the radio group is read-only */
  readOnly?: boolean | undefined;
  /** Whether selection is required */
  required?: boolean | undefined;
  /** Legend / group label */
  legend?: string | undefined;
  /** Item options rendered automatically via wx:for */
  items?: (string | RadioGroupItemRaw)[] | undefined;
  /** Callback fired when selected value changes */
  onChange?: ((details: RadioGroupValueChangeDetails) => void) | undefined;
}

export interface RadioGroupContext {
  readonly value: () => string | null;
  readonly disabled: () => boolean;
  readonly readOnly: () => boolean;
  readonly invalid: () => boolean;
  readonly color: () => RadioGroupColor;
  readonly size: () => RadioGroupSize;
  readonly variant: () => RadioGroupVariant;

  select: (value: string) => void;
  setValue: (value: string | null) => void;
  clear: () => void;
}

export type RadioGroupMachineContext = {
  value: string | null;
  name: string;
  form: string;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean;
  color: RadioGroupColor;
  size: RadioGroupSize;
  orientation: RadioGroupOrientation;
  variant: RadioGroupVariant;
  legend: string;
  items: (string | RadioGroupItemRaw)[];
  ui: RadioGroupUI;
};

export type RadioGroupEvent =
  | { type: "SET_VALUE"; value: string }
  | { type: "CLEAR" }
  | { type: "RESET_VALUE" }
  | { type: "SET_INVALID"; invalid: boolean };

export interface RadioGroupComputed {
  effectiveSize: RadioGroupSize;
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  fieldSize: string;
  isInvalid: boolean;

  isInteractive: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
}

export type RadioGroupGuard = "isInteractive";

export type RadioGroupAction =
  | "setValue"
  | "clearValue"
  | "setInvalid"
  | "setupFormField"
  | "resetValue"
  | "cleanupFormField";

export interface RadioGroupRefs {
  initialValue?: string | null | undefined;
  groupContext: RadioGroupContext;
  formField?: BoundFormField | undefined;
}

export interface RadioGroupSchema extends MachineSchema {
  state: RadioGroupState;
  tag: "idle";
  event: RadioGroupEvent;
  props: RadioGroupProps;
  context: RadioGroupMachineContext;
  computed: RadioGroupComputed;
  refs: RadioGroupRefs;
  action: RadioGroupAction;
  effect: string;
  guard: RadioGroupGuard;
}

export type RadioGroupService = Service<RadioGroupSchema>;
export type RadioGroupMachine = Machine<RadioGroupSchema>;
export type RadioGroupParams = Params<RadioGroupSchema>;

export interface RadioGroupApi {
  /** The currently selected value */
  value: string | null;
  /** Change the selected value */
  setValue: (value: string) => void;
  /** Clear selection */
  clear: () => void;
  /** Whether the group is interactive */
  isInteractive: boolean;
  /** Whether the group is disabled */
  disabled: boolean;
  /** Whether the group is read-only */
  readOnly: boolean;
  /** Whether the group is required */
  required: boolean;
  /** Whether the group is invalid */
  invalid: boolean;
  /** Current size */
  size: RadioGroupSize;
  /** Current color */
  color: RadioGroupColor;
  /** Current orientation */
  orientation: RadioGroupOrientation;
  /** Current variant */
  variant: RadioGroupVariant;
  /** Legend title */
  legend: string;
  /** Pre-computed items with state and props for WXML wx:for rendering */
  items: RadioGroupItem[];
  /** Tap handler for precomputed wx:for items */
  handleItemTap: (e?: any) => void;
  /** Get accessible props for an item container */
  getItemProps: (item: {
    value: string;
    disabled?: boolean | undefined;
  }) => Record<string, any>;
  /** Get accessible props for an item outer circle (base / control) */
  getItemControlProps: (item: {
    value: string;
    disabled?: boolean | undefined;
  }) => Record<string, any>;
  /** Get accessible props for an item inner indicator (dot) */
  getItemIndicatorProps: (item: {
    value: string;
    disabled?: boolean | undefined;
  }) => Record<string, any>;
  /** Underlying bound FormField if registered with `<c-form>` */
  formField?: BoundFormField | undefined;
}

export interface FieldStateSnapshot {
  disabled?: boolean | undefined;
  size?: RadioGroupSize | "" | undefined;
}
