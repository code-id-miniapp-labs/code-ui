import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-ui/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-ui/core";
import type { PopoverContentConfig } from "@code-ui/popover";
import type {
  BoundFormField,
  FormHostContext,
  FormRule,
  FormValidateOn,
} from "@code-ui/form";
import type { MiniAppComponent } from "@code-ui/utils";
import type { anatomy } from "./select.anatomy";

export type SelectState = "closed" | "open" | "closing";
export type SelectTag = "closed" | "open" | "closing";

export type SelectMode = "default" | "picker";
export type SelectVariant = "outline" | "soft" | "subtle" | "ghost" | "none";
export type SelectColor =
  | "primary"
  | "secondary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info"
  | (string & {});
export type SelectSize = "xs" | "sm" | "md" | "lg" | "xl";

export type SelectAnatomyPart = AnatomyPartName<typeof anatomy>;
export type SelectUI = ComponentUI<typeof anatomy>;
export type SelectResolvedUI = ResolvedUI<typeof anatomy>;

export type SelectScalarValue = string | number | boolean;
export type SelectValue = SelectScalarValue | SelectScalarValue[] | null;
export type SelectItemType = "item" | "label" | "separator";

export interface SelectItem {
  type?: SelectItemType | undefined;
  value?: SelectScalarValue | undefined;
  label?: string | undefined;
  description?: string | undefined;
  icon?: string | undefined;
  trailingIcon?: string | undefined;
  disabled?: boolean | undefined;
  key?: string | number | undefined;
  className?: string | undefined;
  ui?: Record<string, string> | undefined;
  [key: string]: any;
}

export type SelectItemInput = SelectScalarValue | SelectItem;
export type SelectItemsInput = SelectItemInput[] | SelectItemInput[][];

export interface SelectChildItemDescriptor {
  value?: SelectScalarValue | undefined;
  label?: string | undefined;
  description?: string | undefined;
  disabled?: boolean | undefined;
  type?: SelectItemType | undefined;
}

export interface NormalizedSelectItem {
  key: string;
  type: SelectItemType;
  value: SelectScalarValue;
  label: string;
  description: string;
  disabled: boolean;
  rawIndex: number;
  groupIndex: number;
}

export interface SelectSnapshotItem {
  key: string;
  domId: string;
  type: SelectItemType;
  value: SelectScalarValue;
  label: string;
  disabled: boolean;
  selected: boolean;
  rawIndex: number;
  groupIndex: number;
}

export interface SelectPickerColumnItem {
  key: string;
  value: SelectScalarValue;
  label: string;
  disabled: boolean;
  index: number;
}

export interface SelectContentConfig extends PopoverContentConfig {}

export interface SelectValueChangeDetails {
  value: SelectValue;
  item?: NormalizedSelectItem | undefined;
  items?: NormalizedSelectItem[] | undefined;
}

export interface SelectSelectDetails {
  value: SelectScalarValue;
  item?: NormalizedSelectItem | undefined;
  selected: boolean;
}

export interface SelectConfirmDetails {
  value: SelectValue;
  label: string | string[];
  index: number[];
  items: SelectPickerColumnItem[];
}

export interface SelectColumnChangeDetails {
  column: number;
  index: number;
  value: SelectScalarValue;
  label: string;
  item: SelectPickerColumnItem;
  values: SelectScalarValue[];
  items: SelectPickerColumnItem[];
}

export interface SelectOpenChangeDetails {
  open: boolean;
}

export interface SelectGroupContext {
  readonly value: () => SelectValue;
  readonly multiple: () => boolean;
  readonly disabled: () => boolean;
  readonly isSelected: (val: SelectScalarValue) => boolean;
  readonly select: (val: SelectScalarValue) => void;
}

export interface SelectProps {
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
  /** Optional target `<c-form>` id/name */
  form?: string | undefined;
  /** Form field name */
  name?: string | undefined;
  /** Field-level override for Form validation triggers */
  validateOn?: FormValidateOn | undefined;
  /** Whether the field is invalid */
  invalid?: boolean | null | undefined;
  /** Form field wrapper disabled state */
  fieldDisabled?: boolean | undefined;
  /** Interaction mode: dropdown menu or WeChat picker-view bottom sheet */
  mode?: SelectMode | undefined;
  /** Controlled selected value (`null` = uncontrolled) */
  value?: SelectValue | undefined;
  /** Initial value when uncontrolled */
  defaultValue?: SelectValue | undefined;
  /** Controlled open state (`null` = uncontrolled) */
  open?: boolean | null | undefined;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean | undefined;
  /** Allow selecting multiple items in default dropdown mode */
  multiple?: boolean | undefined;
  /** Options array (flat, grouped nested arrays, or multi-column arrays in picker mode) */
  items?: SelectItemsInput | undefined;
  /** Declarative `<c-select-item>` children normalized by MiniApp relation behavior */
  childItems?: SelectChildItemDescriptor[] | undefined;
  /** Property key for item value */
  valueKey?: string | undefined;
  /** Property key for item label */
  labelKey?: string | undefined;
  /** Property key for item description */
  descriptionKey?: string | undefined;
  /** Property key for item disabled flag */
  disabledKey?: string | undefined;
  /** Whether the select is disabled */
  disabled?: boolean | undefined;
  /** Whether the select is read-only */
  readOnly?: boolean | undefined;
  /** Whether selection is required */
  required?: boolean | undefined;
  /** Close dropdown on item select (`null` = auto: `!multiple`) */
  closeOnSelect?: boolean | null | undefined;
  /** Whether tapping backdrop closes the overlay */
  closeOnBackdropClick?: boolean | undefined;
  /** Whether clear button can clear selection */
  clearable?: boolean | undefined;
  /** Close transition duration in ms */
  duration?: number | undefined;
  /** Callback fired when selected value changes */
  onChange?: ((details: SelectValueChangeDetails) => void) | undefined;
  /** Callback fired when an item is clicked in dropdown */
  onSelect?: ((details: SelectSelectDetails) => void) | undefined;
  /** Callback fired when open state changes */
  onOpenChange?: ((details: SelectOpenChangeDetails) => void) | undefined;
  /** Callback fired when picker confirm button is tapped */
  onConfirm?: ((details: SelectConfirmDetails) => void) | undefined;
  /** Callback fired when picker is cancelled */
  onCancel?: ((details: { trigger?: string | undefined }) => void) | undefined;
  /** Callback fired when a picker column changes */
  onColumnChange?: ((details: SelectColumnChangeDetails) => void) | undefined;
  /** Callback fired when clear button is tapped */
  onClear?: ((details?: Record<string, any>) => void) | undefined;
}

type SelectDefaultedKey =
  | "value"
  | "defaultValue"
  | "open"
  | "defaultOpen"
  | "mode"
  | "multiple"
  | "items"
  | "childItems"
  | "valueKey"
  | "labelKey"
  | "descriptionKey"
  | "disabledKey"
  | "disabled"
  | "readOnly"
  | "required"
  | "invalid"
  | "fieldDisabled"
  | "name"
  | "form"
  | "closeOnSelect"
  | "closeOnBackdropClick"
  | "clearable"
  | "duration";

export type SelectResolvedProps = Omit<SelectProps, SelectDefaultedKey> & {
  [K in SelectDefaultedKey]-?: Exclude<SelectProps[K], undefined>;
};

export interface SelectContext {
  value: SelectValue;
  invalid: boolean;
  pendingIndices: number[];
}

export interface SelectComputed {
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  isInvalid: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInteractive: boolean;
  isOpen: boolean;
  isVisible: boolean;
  normalizedItems: NormalizedSelectItem[];
  pickerColumns: SelectPickerColumnItem[][];
  selectedLabels: string[];
  displayLabel: string;
  hasValue: boolean;
  isClearable: boolean;
}

export interface SelectRefs {
  initialValue?: SelectValue | undefined;
  formField?: BoundFormField | undefined;
  groupContext: SelectGroupContext;
}

export type SelectEvent =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" }
  | { type: "SELECT_ITEM"; value: SelectScalarValue }
  | { type: "SET_VALUE"; value: SelectValue }
  | { type: "CLEAR_VALUE" }
  | { type: "RESET_VALUE" }
  | { type: "PICKER.CHANGE"; indices: number[] }
  | { type: "PICKER.CONFIRM" }
  | { type: "PICKER.CANCEL"; trigger?: string | undefined }
  | { type: "BACKDROP.TAP" }
  | { type: "ANIMATION_END" };

export interface SelectSchema extends MachineSchema {
  state: SelectState;
  tag: SelectTag;
  event: SelectEvent;
  props: SelectResolvedProps;
  context: SelectContext;
  computed: SelectComputed;
  refs: SelectRefs;
  action: string;
  effect: string;
  guard: string;
}

export type SelectMachine = Machine<SelectSchema>;
export type SelectService = Service<SelectSchema>;
export type SelectParams = Params<SelectSchema>;

export interface SelectApi {
  state: SelectState;
  open: boolean;
  visible: boolean;
  value: SelectValue;
  displayLabel: string;
  hasValue: boolean;
  isClearable: boolean;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  items: SelectSnapshotItem[];
  pickerColumns: SelectPickerColumnItem[][];
  pickerIndices: number[];
  activeItemDomId: string;

  openSelect(): void;
  closeSelect(): void;
  toggle(): void;
  setOpen(open: boolean): void;
  setValue(value: SelectValue): void;
  selectValue(value: SelectScalarValue): void;
  clearValue(): void;
  resetValue(): void;
  handlePickerChange(indices: number[]): void;
  confirmPicker(): void;
  cancelPicker(trigger?: string): void;
  handleBackdropTap(): void;

  rootProps: Record<string, any>;
  triggerProps: Record<string, any>;
  contentProps: Record<string, any>;
  hiddenInputProps: Record<string, any>;
}
