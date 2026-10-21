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
import type { anatomy } from "./checkbox-group.anatomy";

export type CheckboxGroupState = "idle";

export type CheckboxGroupColor =
  | "primary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info"
  | (string & {});

export type CheckboxGroupSize = "xs" | "sm" | "md" | "lg" | "xl";

export type CheckboxGroupOrientation = "horizontal" | "vertical";

export type CheckboxGroupVariant = "outline" | "card";

export interface CheckboxGroupBusEvents {
  "checkbox:toggle": { value: string };
  "group:change": {
    value: string[];
    disabled: boolean;
    invalid: boolean;
    size: CheckboxGroupSize;
    color: CheckboxGroupColor;
    variant: CheckboxGroupVariant;
  };
}

export type CheckboxGroupAnatomyPart = AnatomyPartName<typeof anatomy>;
export type CheckboxGroupUI = ComponentUI<typeof anatomy>;
export type CheckboxGroupResolvedUI = ResolvedUI<typeof anatomy>;

export interface CheckboxGroupValueChangeDetails {
  value: string[];
}

export interface CheckboxGroupItemRaw {
  value: string;
  label?: string | undefined;
  description?: string | undefined;
  disabled?: boolean | undefined;
  [key: string]: any;
}

export interface CheckboxGroupItem {
  value: string;
  label: string;
  description: string;
  disabled: boolean;
  checked: boolean;
  color?: CheckboxGroupColor | undefined;
  variant?: CheckboxGroupVariant | undefined;
  ui?: Record<string, any> | undefined;
  itemProps: Record<string, any>;
  controlProps: Record<string, any>;
  indicatorProps: Record<string, any>;
}

export interface CheckboxGroupProps {
  /** The unique id of the component */
  id?: string | undefined;
  /** Sub-element ids */
  ids?: Record<string, any> | undefined;
  /** The MiniApp component instance */
  component?: MiniAppComponent | undefined;
  /** Optional explicit Form EventBus */
  formBus?: EventBus<FormBusEvents> | undefined;
  /** Custom UI slot classes */
  ui?: CheckboxGroupUI | undefined;
  /** Optional target `<c-form>` id/name when multiple forms exist on the same Page */
  form?: string | undefined;
  /** Form field name for hidden input and Form registration */
  name?: string | undefined;
  /** Controlled selected values */
  value?: string[] | null | undefined;
  /** Default selected values for uncontrolled mode */
  defaultValue?: string[] | null | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the checkbox group is currently invalid */
  invalid?: boolean | null | undefined;
  /** Semantic color variant */
  color?: CheckboxGroupColor | undefined;
  /** Size variant */
  size?: CheckboxGroupSize | undefined;
  /** Layout orientation */
  orientation?: CheckboxGroupOrientation | undefined;
  /** Visual variant (outline or card) */
  variant?: CheckboxGroupVariant | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Form field wrapper size override */
  fieldSize?: CheckboxGroupSize | undefined;
  /** Whether the entire checkbox group is disabled */
  disabled?: boolean | undefined;
  /** Whether the checkbox group is read-only */
  readOnly?: boolean | undefined;
  /** Whether selection is required */
  required?: boolean | undefined;
  /** Legend / group label */
  legend?: string | undefined;
  /** Minimum number of items that must be selected */
  min?: number | null | undefined;
  /** Maximum number of items that can be selected */
  max?: number | null | undefined;
  /** Item options rendered automatically via wx:for */
  items?: (string | CheckboxGroupItemRaw)[] | undefined;
  /** Callback fired when selected values change */
  onValueChange?: ((details: CheckboxGroupValueChangeDetails) => void) | undefined;
  /** Legacy/generic change callback */
  onChange?: ((details: CheckboxGroupValueChangeDetails) => void) | undefined;
}

export type CheckboxGroupContext = {
  value: string[];
  name: string;
  form: string;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean;
  color: CheckboxGroupColor;
  size: CheckboxGroupSize;
  orientation: CheckboxGroupOrientation;
  variant: CheckboxGroupVariant;
  legend: string;
  min: number | null;
  max: number | null;
  items: (string | CheckboxGroupItemRaw)[];
  ui: CheckboxGroupUI;
  fieldDisabled: boolean;
  fieldSize: CheckboxGroupSize | "";
  formDisabled: boolean;
  formReadOnly: boolean;
};

export type CheckboxGroupEvent =
  | { type: "SET_VALUE"; value: string[] }
  | { type: "TOGGLE_VALUE"; value: string; checked?: boolean | undefined }
  | { type: "SELECT_ALL" }
  | { type: "CLEAR" }
  | { type: "RESET_VALUE" }
  | { type: "SET_INVALID"; invalid: boolean };

export interface CheckboxGroupComputed {
  isInteractive: boolean;
}

export interface CheckboxGroupRefs {
  initialValue?: string[] | undefined;
  bus?: EventBus<CheckboxGroupBusEvents> | undefined;
  formField?: BoundFormField | undefined;
  currentFormBus?: EventBus<FormBusEvents> | undefined;
  busDisposers?: Array<() => void> | undefined;
}

export interface CheckboxGroupSchema extends MachineSchema {
  state: CheckboxGroupState;
  tag: "idle";
  event: CheckboxGroupEvent;
  props: CheckboxGroupProps;
  context: CheckboxGroupContext;
  computed: CheckboxGroupComputed;
  refs: CheckboxGroupRefs;
  action: string;
  effect: string;
  guard: string;
}

export type CheckboxGroupService = Service<CheckboxGroupSchema>;
export type CheckboxGroupMachine = Machine<CheckboxGroupSchema>;
export type CheckboxGroupParams = Params<CheckboxGroupSchema>;

export interface CheckboxGroupApi {
  /** The currently selected values */
  value: string[];
  /** Change the selected values */
  setValue: (value: string[]) => void;
  /** Toggle a specific value in the group */
  toggleValue: (value: string) => void;
  /** Select all items in items array */
  selectAll: () => void;
  /** Clear all selections */
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
  size: CheckboxGroupSize;
  /** Current color */
  color: CheckboxGroupColor;
  /** Current orientation */
  orientation: CheckboxGroupOrientation;
  /** Current variant */
  variant: CheckboxGroupVariant;
  /** Legend title */
  legend: string;
  /** Pre-computed items with state and props for WXML wx:for rendering */
  items: CheckboxGroupItem[];
  /** Tap handler for precomputed wx:for items */
  handleItemTap: (e?: any) => void;
  /** Get accessible props for an item container */
  getItemProps: (item: { value: string; disabled?: boolean | undefined }) => Record<string, any>;
  /** Get accessible props for an item outer box (base / control) */
  getItemControlProps: (item: { value: string; disabled?: boolean | undefined }) => Record<string, any>;
  /** Get accessible props for an item inner indicator */
  getItemIndicatorProps: (item: { value: string; disabled?: boolean | undefined }) => Record<string, any>;
  /** Underlying bound FormField if registered with `<c-form>` */
  formField?: BoundFormField | undefined;
}
