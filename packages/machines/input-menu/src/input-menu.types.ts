import type {
  AnatomyPartName,
  ComponentUI,
  ResolvedUI,
} from "@code-id-labs/anatomy";
import type { Machine, MachineSchema, Params, Service } from "@code-id-labs/core";
import type { PopoverContentConfig } from "@code-id-labs/popover";
import type {
  BoundFormField,
  FormHostContext,
  FormRule,
  FormValidateOn,
} from "@code-id-labs/form";
import type { MiniAppComponent } from "@code-id-labs/utils";
import type { anatomy } from "./input-menu.anatomy";

export type InputMenuState = "closed" | "open" | "closing";
export type InputMenuTag = "closed" | "open" | "closing";

export type InputMenuVariant = "outline" | "soft" | "subtle" | "ghost" | "none";
export type InputMenuColor =
  | "primary"
  | "secondary"
  | "neutral"
  | "danger"
  | "success"
  | "warning"
  | "info"
  | (string & {});
export type InputMenuSize = "xs" | "sm" | "md" | "lg" | "xl";

export type InputMenuAnatomyPart = AnatomyPartName<typeof anatomy>;
export type InputMenuUI = ComponentUI<typeof anatomy>;
export type InputMenuResolvedUI = ResolvedUI<typeof anatomy>;

export type InputMenuScalarValue = string | number | boolean;
export type InputMenuValue =
  | InputMenuScalarValue
  | InputMenuScalarValue[]
  | null;
export type InputMenuItemType = "item" | "label" | "separator";

export type InputMenuCreateItemPosition = "top" | "bottom";
export type InputMenuCreateItemWhen = "empty" | "always";

export interface InputMenuCreateItemConfig {
  position?: InputMenuCreateItemPosition | undefined;
  when?: InputMenuCreateItemWhen | undefined;
}

export type InputMenuCreateItemProp =
  | boolean
  | "always"
  | InputMenuCreateItemConfig;

export interface InputMenuItem {
  type?: InputMenuItemType | undefined;
  value?: InputMenuScalarValue | undefined;
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

export type InputMenuItemInput = InputMenuScalarValue | InputMenuItem;
export type InputMenuItemsInput = InputMenuItemInput[] | InputMenuItemInput[][];

export interface InputMenuChildItemDescriptor {
  value?: InputMenuScalarValue | undefined;
  label?: string | undefined;
  description?: string | undefined;
  disabled?: boolean | undefined;
  type?: InputMenuItemType | undefined;
}

export interface NormalizedInputMenuItem {
  key: string;
  type: InputMenuItemType;
  value: InputMenuScalarValue;
  label: string;
  description: string;
  disabled: boolean;
  rawIndex: number;
  groupIndex: number;
  searchFields: string[];
}

export interface InputMenuSnapshotItem {
  key: string;
  domId: string;
  type: InputMenuItemType;
  value: InputMenuScalarValue;
  label: string;
  disabled: boolean;
  selected: boolean;
  rawIndex: number;
  groupIndex: number;
}

export interface InputMenuTagItem {
  key: string;
  value: InputMenuScalarValue;
  label: string;
  disabled: boolean;
  rawIndex: number;
  groupIndex: number;
}

export interface InputMenuContentConfig extends PopoverContentConfig {}

export interface InputMenuValueChangeDetails {
  value: InputMenuValue;
  item?: NormalizedInputMenuItem | undefined;
  items?: NormalizedInputMenuItem[] | undefined;
}

export interface InputMenuSelectDetails {
  value: InputMenuScalarValue;
  item?: NormalizedInputMenuItem | undefined;
  selected: boolean;
}

export interface InputMenuOpenChangeDetails {
  open: boolean;
}

export interface InputMenuSearchTermChangeDetails {
  value: string;
}

export interface InputMenuCreateDetails {
  value: string;
}

export interface InputMenuGroupContext {
  readonly value: () => InputMenuValue;
  readonly multiple: () => boolean;
  readonly disabled: () => boolean;
  readonly searchTerm: () => string;
  readonly isSelected: (val: InputMenuScalarValue) => boolean;
  readonly isChildIndexVisible: (groupIndex: number) => boolean;
  readonly select: (val: InputMenuScalarValue) => void;
}

export interface InputMenuProps {
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
  /** Controlled selected value (`null` = uncontrolled) */
  value?: InputMenuValue | undefined;
  /** Initial value when uncontrolled */
  defaultValue?: InputMenuValue | undefined;
  /** Controlled search query (`null` = uncontrolled) */
  searchTerm?: string | null | undefined;
  /** Initial search query when uncontrolled */
  defaultSearchTerm?: string | undefined;
  /** Controlled open state (`null` = uncontrolled) */
  open?: boolean | null | undefined;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean | undefined;
  /** Allow selecting multiple items (rendered as tags) */
  multiple?: boolean | undefined;
  /** Options array (flat or grouped nested arrays) */
  items?: InputMenuItemsInput | undefined;
  /** Declarative `<c-input-menu-item>` children normalized by MiniApp relation behavior */
  childItems?: InputMenuChildItemDescriptor[] | undefined;
  /** Property key for item value */
  valueKey?: string | undefined;
  /** Property key for item label */
  labelKey?: string | undefined;
  /** Property key for item description */
  descriptionKey?: string | undefined;
  /** Property key for item disabled flag */
  disabledKey?: string | undefined;
  /** Fields to match against searchTerm when filtering */
  filterFields?: string[] | undefined;
  /** Disable built-in filtering (for custom/async server filtering) */
  ignoreFilter?: boolean | undefined;
  /** Reset searchTerm when the menu closes or blurs */
  resetSearchTermOnBlur?: boolean | undefined;
  /** Reset searchTerm when an item is selected */
  resetSearchTermOnSelect?: boolean | undefined;
  /** Enable dynamic item creation from searchTerm */
  createItem?: InputMenuCreateItemProp | undefined;
  /** Open dropdown when input is focused */
  openOnFocus?: boolean | undefined;
  /** Open dropdown when trigger is tapped */
  openOnClick?: boolean | undefined;
  /** Open dropdown when user types in input */
  openOnInput?: boolean | undefined;
  /** Close dropdown on item select (`null` = auto: `!multiple`) */
  closeOnSelect?: boolean | null | undefined;
  /** Whether tapping backdrop closes the overlay */
  closeOnBackdropClick?: boolean | undefined;
  /** Whether clear button can clear selection */
  clearable?: boolean | undefined;
  /** Whether the input menu is disabled */
  disabled?: boolean | undefined;
  /** Whether the input menu is read-only */
  readOnly?: boolean | undefined;
  /** Whether selection is required */
  required?: boolean | undefined;
  /** Close transition duration in ms */
  duration?: number | undefined;
  /** Callback fired when selected value changes */
  onChange?: ((details: InputMenuValueChangeDetails) => void) | undefined;
  /** Callback fired when an item is clicked in dropdown */
  onSelect?: ((details: InputMenuSelectDetails) => void) | undefined;
  /** Callback fired when open state changes */
  onOpenChange?: ((details: InputMenuOpenChangeDetails) => void) | undefined;
  /** Callback fired when searchTerm changes */
  onSearchTermChange?:
    | ((details: InputMenuSearchTermChangeDetails) => void)
    | undefined;
  /** Callback fired when create-item option is triggered */
  onCreate?: ((details: InputMenuCreateDetails) => void) | undefined;
  /** Callback fired when clear button is tapped */
  onClear?: ((details?: Record<string, any>) => void) | undefined;
  /** Callback fired when input gains focus */
  onFocus?:
    | ((details: { value: InputMenuValue; searchTerm: string }) => void)
    | undefined;
  /** Callback fired when input loses focus */
  onBlur?:
    | ((details: { value: InputMenuValue; searchTerm: string }) => void)
    | undefined;
}

type InputMenuDefaultedKey =
  | "value"
  | "defaultValue"
  | "searchTerm"
  | "defaultSearchTerm"
  | "open"
  | "defaultOpen"
  | "multiple"
  | "items"
  | "childItems"
  | "valueKey"
  | "labelKey"
  | "descriptionKey"
  | "disabledKey"
  | "filterFields"
  | "ignoreFilter"
  | "resetSearchTermOnBlur"
  | "resetSearchTermOnSelect"
  | "createItem"
  | "openOnFocus"
  | "openOnClick"
  | "openOnInput"
  | "closeOnSelect"
  | "closeOnBackdropClick"
  | "clearable"
  | "disabled"
  | "readOnly"
  | "required"
  | "invalid"
  | "fieldDisabled"
  | "name"
  | "form"
  | "duration";

export type InputMenuResolvedProps = Omit<
  InputMenuProps,
  InputMenuDefaultedKey
> & {
  [K in InputMenuDefaultedKey]-?: Exclude<InputMenuProps[K], undefined>;
};

export interface InputMenuContext {
  value: InputMenuValue;
  searchTerm: string;
  isFiltering: boolean;
  focused: boolean;
  invalid: boolean;
}

export interface InputMenuComputed {
  formDisabled: boolean;
  formReadOnly: boolean;
  fieldDisabled: boolean;
  isInvalid: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isInteractive: boolean;
  isOpen: boolean;
  isVisible: boolean;
  normalizedItems: NormalizedInputMenuItem[];
  effectiveSearchTerm: string;
  filteredItems: NormalizedInputMenuItem[];
  selectedTags: InputMenuTagItem[];
  displayLabel: string;
  inputValue: string;
  hasValue: boolean;
  isClearable: boolean;
  showCreateItem: boolean;
  createItemPosition: InputMenuCreateItemPosition;
}

export interface InputMenuRefs {
  initialValue?: InputMenuValue | undefined;
  formField?: BoundFormField | undefined;
  lastRefocusAt?: number | undefined;
  cancelRefocus?: (() => void) | undefined;
  groupContext: InputMenuGroupContext;
}

export type InputMenuEvent =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TOGGLE" }
  | { type: "TRIGGER.TAP" }
  | { type: "FOCUS" }
  | { type: "BLUR" }
  | { type: "INPUT"; value: string }
  | { type: "CONFIRM"; value?: string | undefined }
  | { type: "SELECT_ITEM"; value: InputMenuScalarValue }
  | { type: "REMOVE_TAG"; value: InputMenuScalarValue }
  | { type: "CREATE_ITEM" }
  | { type: "SET_VALUE"; value: InputMenuValue }
  | { type: "SET_SEARCH_TERM"; searchTerm: string }
  | { type: "CLEAR_VALUE" }
  | { type: "RESET_VALUE" }
  | { type: "BACKDROP.TAP" }
  | { type: "ANIMATION_END" };

export interface InputMenuSchema extends MachineSchema {
  state: InputMenuState;
  tag: InputMenuTag;
  event: InputMenuEvent;
  props: InputMenuResolvedProps;
  context: InputMenuContext;
  computed: InputMenuComputed;
  refs: InputMenuRefs;
  action: string;
  effect: string;
  guard: string;
}

export type InputMenuMachine = Machine<InputMenuSchema>;
export type InputMenuService = Service<InputMenuSchema>;
export type InputMenuParams = Params<InputMenuSchema>;

export interface InputMenuApi {
  state: InputMenuState;
  open: boolean;
  visible: boolean;
  focused: boolean;
  value: InputMenuValue;
  searchTerm: string;
  inputValue: string;
  displayLabel: string;
  hasValue: boolean;
  isClearable: boolean;
  disabled: boolean;
  readOnly: boolean;
  invalid: boolean;
  items: InputMenuSnapshotItem[];
  tags: InputMenuTagItem[];
  activeItemDomId: string;
  showCreateItem: boolean;
  createItemPosition: InputMenuCreateItemPosition;

  openInputMenu(): void;
  closeInputMenu(): void;
  toggle(): void;
  handleTriggerTap(): void;
  handleFocus(): void;
  handleBlur(): void;
  focus(): void;
  blur(): void;
  handleInput(value: string): void;
  handleConfirm(value?: string): void;
  setOpen(open: boolean): void;
  setValue(value: InputMenuValue): void;
  setSearchTerm(searchTerm: string): void;
  selectValue(value: InputMenuScalarValue): void;
  removeTag(value: InputMenuScalarValue): void;
  createItem(): void;
  clearValue(): void;
  resetValue(): void;
  handleBackdropTap(): void;

  rootProps: Record<string, any>;
  triggerProps: Record<string, any>;
  inputProps: Record<string, any>;
  contentProps: Record<string, any>;
  hiddenInputProps: Record<string, any>;
}
