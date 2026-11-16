import type {
  AccordionProps,
  AccordionSize,
  AccordionUI,
  AccordionValueChangeDetails,
  AccordionVariant,
} from "@code-ui/accordion";
import type {
  AccordionItemProps,
  AccordionItemOpenChangeDetails,
  AccordionItemUI,
} from "@code-ui/accordion-item";
import type {
  ActionSheetAction,
  ActionSheetActionDetails,
  ActionSheetCloseProps,
  ActionSheetItem,
  ActionSheetSelectDetails,
  ActionSheetUI,
} from "@code-ui/action-sheet";
import type {
  BannerBadgeProps,
  BannerButtonProps,
  BannerColor,
  BannerImagePosition,
  BannerImageShape,
  BannerMode,
  BannerPlacement,
  BannerProps,
  BannerSize,
  BannerUI,
  BannerVariant,
} from "@code-ui/banner";
import type {
  ButtonColor,
  ButtonSize,
  ButtonUI,
  ButtonVariant,
} from "@code-ui/button";
import type {
  CheckboxCheckedChangeDetails,
  CheckboxColor,
  CheckboxSize,
  CheckboxUI,
} from "@code-ui/checkbox";
import type {
  CheckboxGroupColor,
  CheckboxGroupOrientation,
  CheckboxGroupProps,
  CheckboxGroupSize,
  CheckboxGroupUI,
  CheckboxGroupValueChangeDetails,
  CheckboxGroupVariant,
} from "@code-ui/checkbox-group";
import type { DrawerCloseProps, DrawerProps, DrawerUI } from "@code-ui/drawer";
import type {
  FileUploadChangeDetails,
  FileUploadColor,
  FileUploadFile,
  FileUploadLayout,
  FileUploadProps,
  FileUploadRejectedFile,
  FileUploadSize,
  FileUploadUI,
  FileUploadVariant,
} from "@code-ui/file-upload";
import type {
  FloatingAlign,
  FloatingMatchWidth,
  FloatingMenuOpenChangeDetails,
  FloatingMenuUI,
  FloatingSide,
  FloatingTriggerMode,
} from "@code-ui/floating-menu";
import type {
  FormErrorDetails,
  FormRule,
  FormSubmitDetails,
  FormUI,
  FormValidateOn,
  FormValidationResult,
} from "@code-ui/form";
import type {
  InputColor,
  InputSize,
  InputType,
  InputUI,
  InputValueChangeDetails,
  InputVariant,
} from "@code-ui/input";
import type {
  ModalCloseProps,
  ModalOpenChangeDetails,
  ModalSize,
  ModalUI,
} from "@code-ui/modal";
import type {
  PinInputColor,
  PinInputProps,
  PinInputSize,
  PinInputUI,
  PinInputValueChangeDetails,
  PinInputValueInvalidDetails,
  PinInputVariant,
} from "@code-ui/pin-input";
import type {
  ProgressAnimation,
  ProgressColor,
  ProgressOrientation,
  ProgressProps,
  ProgressSize,
  ProgressType,
  ProgressUI,
  ProgressValueChangeDetails,
} from "@code-ui/progress";
import type {
  PullDownRefreshChangeDetails,
  PullDownRefreshDragDetails,
  PullDownRefreshRefreshDetails,
  PullDownRefreshScrollDetails,
  PullDownRefreshUI,
} from "@code-ui/pull-down-refresh";
import type {
  QrCodeProps,
  QrCodeSize,
  QrCodeUI,
  QrCodeValueChangeDetails,
} from "@code-ui/qr-code";
import type {
  RadioGroupColor,
  RadioGroupOrientation,
  RadioGroupProps,
  RadioGroupSize,
  RadioGroupUI,
  RadioGroupValueChangeDetails,
} from "@code-ui/radio-group";
import type {
  RadioColor,
  RadioSize,
  RadioUI,
  RadioVariant,
} from "@code-ui/radio";
import type {
  SelectColor,
  SelectColumnChangeDetails,
  SelectConfirmDetails,
  SelectContentConfig,
  SelectItemType,
  SelectItemsInput,
  SelectMode,
  SelectOpenChangeDetails,
  SelectScalarValue,
  SelectSelectDetails,
  SelectSize,
  SelectUI,
  SelectValue,
  SelectValueChangeDetails,
  SelectVariant,
} from "@code-ui/select";
import type {
  SelectItemColor,
  SelectItemSize,
  SelectItemUI,
} from "@code-ui/select-item";
import type {
  StepperColor,
  StepperOrientation,
  StepperProps,
  StepperSize,
  StepperStepChangeDetails,
  StepperUI,
  StepperVariant,
} from "@code-ui/stepper";
import type { StepperItemUI } from "@code-ui/stepper-item";
import type {
  SliderChangeDetails,
  SliderProps,
  SliderSize,
  SliderUI,
} from "@code-ui/slider";
import type { SwitchColor, SwitchSize, SwitchUI } from "@code-ui/switch";
import type {
  SwipeCellActionClickDetails,
  SwipeCellOpenChangeDetails,
  SwipeCellProps,
  SwipeCellUI,
} from "@code-ui/swipe-cell";
import type {
  TabsColor,
  TabsOrientation,
  TabsProps,
  TabsSize,
  TabsUI,
  TabsValueChangeDetails,
  TabsVariant,
} from "@code-ui/tabs";
import type { TabsItemProps, TabsItemUI } from "@code-ui/tabs-item";
import type {
  TextareaColor,
  TextareaLineChangeDetails,
  TextareaSize,
  TextareaUI,
  TextareaValueChangeDetails,
  TextareaVariant,
} from "@code-ui/textarea";
import type {
  ToastCloseProps,
  ToastColor,
  ToastMode,
  ToastOrientation,
  ToastPlacement,
  ToastProps,
  ToastUI,
  ToastVariant,
} from "@code-ui/toast";
import type { ThemeColor } from "@code-ui/core";

export interface CuiCommonElementProps {
  id?: string;
  class?: string;
  className?: string;
  style?: string | Record<string, any>;
  slot?: string;
  slots?: Record<string, boolean>;
  key?: string | number;
  children?: any;
}

export interface CuiButtonElementProps extends CuiCommonElementProps {
  ui?: ButtonUI;
  loading?: boolean;
  disabled?: boolean;
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  label?: string;
  icon?: string;
  leading?: boolean;
  leadingIcon?: string;
  trailing?: boolean;
  trailingIcon?: string;
  loadingIcon?: string;
  loadingAuto?: boolean;
  autoResetDuration?: number;
  openType?: string;
  formType?: string;
  onTap?: (event?: any) => void;
  onGetPhoneNumber?: (event?: any) => void;
  onChooseAvatar?: (event?: any) => void;
}

export interface CuiAppElementProps extends CuiCommonElementProps {
  ui?: Partial<Record<"root", string>>;
  /** Apply safe-area padding. Defaults to `"none"`. */
  safeArea?: "none" | "top" | "bottom" | "both";
  topBarHeight?: number;
  bottomBarHeight?: number;
  autoDetectBars?: boolean;
}

export interface CuiBannerElementProps extends CuiCommonElementProps {
  ui?: BannerUI;
  open?: boolean;
  defaultOpen?: boolean;
  color?: BannerColor;
  variant?: BannerVariant;
  size?: BannerSize;
  placement?: BannerPlacement;
  mode?: BannerMode;
  title?: string;
  description?: string;
  caption?: string;
  badge?: string | BannerBadgeProps;
  icon?: string;
  infoIcon?: string;
  successIcon?: string;
  warningIcon?: string;
  errorIcon?: string;
  image?: string;
  imagePosition?: BannerImagePosition;
  imageShape?: BannerImageShape;
  imageMode?: string;
  close?: boolean | BannerButtonProps;
  more?: boolean | BannerButtonProps;
  actions?: BannerProps["actions"];
  hoverClass?: string;
  topOffset?: number | string;
  bottomOffset?: number | string;
  autoInset?: boolean;
  onTap?: (event: WechatMiniprogram.CustomEvent<{ id?: string }>) => void;
  onOpenChange?: (
    event: WechatMiniprogram.CustomEvent<{ open: boolean; id?: string }>,
  ) => void;
  onDismiss?: (event: WechatMiniprogram.CustomEvent<{ id?: string }>) => void;
  onAction?: (
    event: WechatMiniprogram.CustomEvent<{
      action: any;
      index: number;
      id?: string;
    }>,
  ) => void;
  onMore?: (event: WechatMiniprogram.CustomEvent<{ id?: string }>) => void;
}

export interface CuiCardElementProps extends CuiCommonElementProps {
  ui?: Partial<
    Record<
      "root" | "header" | "title" | "description" | "body" | "footer",
      string
    >
  >;
  variant?: "outline" | "solid" | "soft" | "subtle";
  size?: "sm" | "md" | "lg";
  title?: string;
  description?: string;
}

export interface CuiCheckboxElementProps extends CuiCommonElementProps {
  ui?: CheckboxUI;
  name?: string;
  value?: string;
  label?: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  defaultIndeterminate?: boolean;
  color?: CheckboxColor;
  size?: CheckboxSize;
  variant?: "outline" | "card" | (string & {});
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean | null;
  icon?: string;
  indeterminateIcon?: string;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<CheckboxCheckedChangeDetails>,
  ) => void;
}

export interface CuiChipElementProps extends CuiCommonElementProps {
  ui?: Partial<Record<"root" | "base", string>>;
  text?: string | number;
  color?: ThemeColor;
  size?: "3xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  inset?: boolean;
  standalone?: boolean;
  show?: boolean;
}

export interface CuiDrawerElementProps extends CuiCommonElementProps {
  ui?: DrawerUI;
  open?: boolean;
  placement?: DrawerProps["placement"];
  close?: boolean | DrawerCloseProps;
  closeOnBackdropClick?: boolean;
  dismissible?: boolean;
  threshold?: number;
  duration?: number;
  onClose?: (event?: any) => void;
  onCloseTriggerTap?: (event: WechatMiniprogram.CustomEvent) => void;
  onBackdropTap?: (event: WechatMiniprogram.CustomEvent) => void;
  onDragStart?: (event: WechatMiniprogram.CustomEvent) => void;
  onDrag?: (event: WechatMiniprogram.CustomEvent) => void;
  onDragEnd?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiModalElementProps extends CuiCommonElementProps {
  ui?: ModalUI;
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  description?: string;
  overlay?: boolean;
  scrollable?: boolean;
  fullscreen?: boolean;
  transition?: boolean;
  dismissible?: boolean;
  closeOnBackdropClick?: boolean;
  duration?: number;
  size?: ModalSize;
  close?: boolean | ModalCloseProps;
  closeIcon?: string;
  onOpenChange?: (
    event: WechatMiniprogram.CustomEvent<ModalOpenChangeDetails>,
  ) => void;
  onClose?: (event: WechatMiniprogram.CustomEvent) => void;
  onClosePrevent?: (event: WechatMiniprogram.CustomEvent) => void;
  onEnter?: (event: WechatMiniprogram.CustomEvent) => void;
  onAfterEnter?: (event: WechatMiniprogram.CustomEvent) => void;
  onLeave?: (event: WechatMiniprogram.CustomEvent) => void;
  onAfterLeave?: (event: WechatMiniprogram.CustomEvent) => void;
  onOverlayTap?: (event: WechatMiniprogram.CustomEvent) => void;
  onCloseTriggerTap?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiFileUploadElementProps extends CuiCommonElementProps {
  ui?: FileUploadUI;
  name?: string;
  value?: FileUploadFile[];
  defaultValue?: FileUploadFile[];
  color?: FileUploadColor;
  variant?: FileUploadVariant;
  size?: FileUploadSize;
  layout?: FileUploadLayout;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  minSize?: number;
  accept?: string | string[];
  mode?: FileUploadProps["mode"];
  sourceType?: FileUploadProps["sourceType"];
  mediaType?: FileUploadProps["mediaType"];
  sizeType?: FileUploadProps["sizeType"];
  camera?: FileUploadProps["camera"];
  maxDuration?: number;
  interactive?: boolean;
  dropzone?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  label?: string;
  title?: string;
  description?: string;
  icon?: string;
  loadingIcon?: string;
  deleteIcon?: string;
  fileIcon?: string;
  imageIcon?: string;
  videoIcon?: string;
  successIcon?: string;
  errorIcon?: string;
  uploading?: boolean;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<FileUploadChangeDetails>,
  ) => void;
  onAccept?: (
    event: WechatMiniprogram.CustomEvent<{ files: FileUploadFile[] }>,
  ) => void;
  onReject?: (
    event: WechatMiniprogram.CustomEvent<{ files: FileUploadRejectedFile[] }>,
  ) => void;
  onRemove?: (
    event: WechatMiniprogram.CustomEvent<{
      file: FileUploadFile;
      index: number;
    }>,
  ) => void;
  onPreview?: (
    event: WechatMiniprogram.CustomEvent<{
      file: FileUploadFile;
      index: number;
    }>,
  ) => void;
  onFileClick?: (
    event: WechatMiniprogram.CustomEvent<{
      file: FileUploadFile;
      index: number;
    }>,
  ) => void;
}

export interface CuiFormElementProps extends CuiCommonElementProps {
  ui?: FormUI;
  value?: Record<string, any>;
  defaultValue?: Record<string, any>;
  rules?: Record<string, FormRule[]>;
  validateOn?: FormValidateOn;
  validateLazy?: boolean;
  focusOnError?: boolean;
  scrollToError?: boolean;
  scrollOffset?: number;
  disabled?: boolean;
  readOnly?: boolean;
  showErrors?: boolean;
  onSubmit?: (event: WechatMiniprogram.CustomEvent<FormSubmitDetails>) => void;
  onError?: (event: WechatMiniprogram.CustomEvent<FormErrorDetails>) => void;
  onValidate?: (
    event: WechatMiniprogram.CustomEvent<FormValidationResult>,
  ) => void;
  onReset?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiInputElementProps extends CuiCommonElementProps {
  ui?: InputUI;
  name?: string;
  validateOn?: FormValidateOn;
  invalid?: boolean;
  variant?: InputVariant;
  color?: InputColor;
  size?: InputSize;
  highlight?: boolean;
  value?: string | number;
  defaultValue?: string | number;
  type?: InputType;
  password?: boolean;
  placeholder?: string;
  placeholderClass?: string;
  placeholderStyle?: string;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  clearIcon?: string;
  loading?: boolean;
  loadingIcon?: string;
  leadingIcon?: string;
  trailingIcon?: string;
  autoFocus?: boolean;
  maxlength?: number;
  cursorSpacing?: number;
  confirmType?: "send" | "search" | "next" | "go" | "done";
  confirmHold?: boolean;
  cursor?: number;
  selectionStart?: number;
  selectionEnd?: number;
  adjustPosition?: boolean;
  holdKeyboard?: boolean;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<InputValueChangeDetails>,
  ) => void;
  onFocus?: (event: WechatMiniprogram.CustomEvent<{ value: string }>) => void;
  onBlur?: (event: WechatMiniprogram.CustomEvent<{ value: string }>) => void;
  onConfirm?: (event: WechatMiniprogram.CustomEvent<{ value: string }>) => void;
  onClear?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiPinInputElementProps extends CuiCommonElementProps {
  ui?: PinInputUI;
  label?: string;
  name?: string;
  validateOn?: FormValidateOn;
  invalid?: boolean;
  variant?: PinInputVariant;
  color?: PinInputColor;
  size?: PinInputSize;
  highlight?: boolean;
  length?: number;
  value?: string[];
  defaultValue?: string[];
  type?: PinInputProps["type"];
  mask?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  otp?: boolean;
  autoFocus?: boolean;
  blurOnComplete?: boolean;
  selectOnFocus?: boolean;
  separator?: PinInputProps["separator"];
  separatorChar?: string;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<PinInputValueChangeDetails>,
  ) => void;
  onComplete?: (
    event: WechatMiniprogram.CustomEvent<PinInputValueChangeDetails>,
  ) => void;
  onInvalid?: (
    event: WechatMiniprogram.CustomEvent<PinInputValueInvalidDetails>,
  ) => void;
}

export interface CuiFormFieldElementProps extends CuiCommonElementProps {
  ui?: Partial<
    Record<
      | "root"
      | "wrapper"
      | "labelWrapper"
      | "label"
      | "container"
      | "description"
      | "error"
      | "hint"
      | "help"
      | "required",
      string
    >
  >;
  name?: string;
  label?: string;
  description?: string;
  help?: string;
  helperText?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  rules?: FormRule[];
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export interface CuiIconElementProps extends CuiCommonElementProps {
  ui?: Partial<Record<"root" | "icon" | "image", string>>;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | (string & {});
  color?: ThemeColor;
  spin?: boolean;
}

export interface CuiSwitchElementProps extends CuiCommonElementProps {
  ui?: SwitchUI;
  name?: string;
  value?: string;
  label?: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  color?: SwitchColor;
  size?: SwitchSize;
  disabled?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
  checkedIcon?: string;
  uncheckedIcon?: string;
  loadingIcon?: string;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<{ value: boolean; checked: boolean }>,
  ) => void;
}

export interface CuiTextareaElementProps extends CuiCommonElementProps {
  ui?: TextareaUI;
  name?: string;
  value?: string | number | null;
  defaultValue?: string | number | null;
  placeholder?: string;
  placeholderClass?: string;
  placeholderStyle?: string;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  clearIcon?: string;
  loading?: boolean;
  loadingIcon?: string;
  leadingIcon?: string;
  trailingIcon?: string;
  autoFocus?: boolean;
  autoHeight?: boolean;
  fixed?: boolean;
  maxlength?: number;
  showConfirmBar?: boolean;
  cursorSpacing?: number;
  confirmType?: "return" | "send" | "search" | "next" | "go" | "done";
  confirmHold?: boolean;
  cursor?: number;
  selectionStart?: number;
  selectionEnd?: number;
  adjustPosition?: boolean;
  holdKeyboard?: boolean;
  disableDefaultPadding?: boolean;
  count?: boolean;
  variant?: TextareaVariant;
  color?: TextareaColor;
  size?: TextareaSize;
  highlight?: boolean;
  invalid?: boolean | null;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<TextareaValueChangeDetails>,
  ) => void;
  onLineChange?: (
    event: WechatMiniprogram.CustomEvent<TextareaLineChangeDetails>,
  ) => void;
  onFocus?: (event: WechatMiniprogram.CustomEvent) => void;
  onBlur?: (event: WechatMiniprogram.CustomEvent) => void;
  onConfirm?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiRadioGroupElementProps extends CuiCommonElementProps {
  ui?: RadioGroupUI;
  name?: string;
  value?: string | null;
  defaultValue?: string | null;
  color?: RadioGroupColor;
  size?: RadioGroupSize;
  orientation?: RadioGroupOrientation;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean | null;
  legend?: string;
  help?: string;
  error?: string;
  items?: RadioGroupProps["items"];
  onChange?: (
    event: WechatMiniprogram.CustomEvent<RadioGroupValueChangeDetails>,
  ) => void;
}

export interface CuiRadioElementProps extends CuiCommonElementProps {
  ui?: RadioUI;
  value?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  readOnly?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  invalid?: boolean | null;
  color?: RadioColor;
  size?: RadioSize;
  variant?: RadioVariant;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<{ value: string; checked: boolean }>,
  ) => void;
}

export interface CuiCheckboxGroupElementProps extends CuiCommonElementProps {
  ui?: CheckboxGroupUI;
  name?: string;
  value?: string[] | null;
  defaultValue?: string[] | null;
  color?: CheckboxGroupColor;
  size?: CheckboxGroupSize;
  orientation?: CheckboxGroupOrientation;
  variant?: CheckboxGroupVariant;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean | null;
  legend?: string;
  help?: string;
  error?: string;
  min?: number | null;
  max?: number | null;
  items?: CheckboxGroupProps["items"];
  onChange?: (
    event: WechatMiniprogram.CustomEvent<CheckboxGroupValueChangeDetails>,
  ) => void;
}

export interface CuiProgressElementProps extends CuiCommonElementProps {
  ui?: ProgressUI;
  value?: number | null;
  defaultValue?: number | null;
  min?: number;
  max?: number;
  orientation?: ProgressOrientation;
  type?: ProgressType;
  size?: ProgressSize;
  color?: ProgressColor;
  striped?: boolean;
  animated?: boolean;
  animation?: ProgressAnimation;
  inverted?: boolean;
  circleRadius?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  translations?: ProgressProps["translations"];
  onValueChange?: (
    event: WechatMiniprogram.CustomEvent<ProgressValueChangeDetails>,
  ) => void;
}

export interface CuiPullDownRefreshElementProps extends CuiCommonElementProps {
  ui?: PullDownRefreshUI;
  value?: boolean | null;
  defaultValue?: boolean;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
  refreshTimeout?: number;
  successDuration?: number;
  loadingTexts?: string[];
  duration?: number;
  showScrollbar?: boolean;
  enableBackToTop?: boolean;
  scrollIntoView?: string;
  upperThreshold?: number;
  lowerThreshold?: number;
  scrollWithAnimation?: boolean;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<PullDownRefreshChangeDetails>,
  ) => void;
  onRefresh?: (
    event: WechatMiniprogram.CustomEvent<PullDownRefreshRefreshDetails>,
  ) => void | Promise<unknown>;
  onTimeout?: (event: WechatMiniprogram.CustomEvent) => void;
  onScroll?: (
    event: WechatMiniprogram.CustomEvent<PullDownRefreshScrollDetails>,
  ) => void;
  onScrollToUpper?: (event: WechatMiniprogram.CustomEvent) => void;
  onScrollToLower?: (event: WechatMiniprogram.CustomEvent) => void;
  onDragStart?: (event: WechatMiniprogram.CustomEvent) => void;
  onDrag?: (
    event: WechatMiniprogram.CustomEvent<PullDownRefreshDragDetails>,
  ) => void;
  onDragEnd?: (
    event: WechatMiniprogram.CustomEvent<PullDownRefreshDragDetails>,
  ) => void;
}

export interface CuiQrCodeElementProps extends CuiCommonElementProps {
  ui?: QrCodeUI;
  value?: string;
  defaultValue?: string;
  ecc?: QrCodeProps["ecc"];
  border?: number;
  encoding?: QrCodeProps["encoding"];
  pixelSize?: number;
  size?: QrCodeSize;
  color?: QrCodeProps["color"];
  overlaySrc?: string;
  showOverlay?: boolean;
  rootStyle?: string;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<QrCodeValueChangeDetails>,
  ) => void;
}

export interface CuiStepperElementProps extends CuiCommonElementProps {
  ui?: StepperUI;
  step?: number | null;
  value?: number | null;
  modelValue?: number | null;
  defaultStep?: number;
  count?: number;
  linear?: boolean;
  orientation?: StepperOrientation;
  color?: StepperColor;
  size?: StepperSize;
  variant?: StepperVariant;
  disabled?: boolean;
  items?: StepperProps["items"];
  onChange?: (
    event: WechatMiniprogram.CustomEvent<StepperStepChangeDetails>,
  ) => void;
  onComplete?: (event: WechatMiniprogram.CustomEvent<{ step: number }>) => void;
}

export interface CuiStepperItemElementProps extends CuiCommonElementProps {
  ui?: StepperItemUI;
  index?: number | null;
  title?: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  value?: string | number;
  isLast?: boolean | null;
  orientation?: StepperOrientation;
  color?: StepperColor;
  size?: StepperSize;
  variant?: StepperVariant;
  onTap?: (
    event: WechatMiniprogram.CustomEvent<{
      index: number;
      value: string | number;
      status: string;
    }>,
  ) => void;
}

export interface CuiAvatarElementProps extends CuiCommonElementProps {
  src?: string;
  alt?: string;
  mode?: string;
  lazyLoad?: boolean;
  color?: string;
  icon?: string;
  text?: string;
  size?: string;
  ui?: Record<string, string>;
  isGroupCounter?: boolean;
}

export interface CuiAvatarGroupElementProps extends CuiCommonElementProps {
  size?: string;
  max?: number;
  ui?: Record<string, string>;
}

export interface CuiAccordionElementProps extends CuiCommonElementProps {
  ui?: AccordionUI;
  value?: AccordionProps["value"];
  defaultValue?: AccordionProps["defaultValue"];
  modelValue?: AccordionProps["modelValue"];
  multiple?: boolean;
  collapsible?: boolean;
  disabled?: boolean;
  size?: AccordionSize;
  variant?: AccordionVariant;
  items?: AccordionProps["items"];
  onChange?: (
    event: WechatMiniprogram.CustomEvent<AccordionValueChangeDetails>,
  ) => void;
}

export interface CuiAccordionItemElementProps extends CuiCommonElementProps {
  ui?: AccordionItemUI;
  value?: AccordionItemProps["value"];
  label?: string;
  description?: string;
  content?: string;
  icon?: string;
  trailingIcon?: string;
  disabled?: boolean;
  open?: boolean | null;
  defaultOpen?: boolean;
  size?: AccordionSize;
  variant?: AccordionVariant;
  onTap?: (
    event: WechatMiniprogram.CustomEvent<AccordionItemOpenChangeDetails>,
  ) => void;
  onOpenChange?: (
    event: WechatMiniprogram.CustomEvent<AccordionItemOpenChangeDetails>,
  ) => void;
}

export interface CuiActionSheetElementProps extends CuiCommonElementProps {
  ui?: ActionSheetUI;
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  description?: string;
  items?: ActionSheetItem[];
  actions?: ActionSheetAction[];
  loadingIcon?: string;
  close?: boolean | ActionSheetCloseProps;
  closeOnItem?: boolean;
  closeOnBackdropClick?: boolean;
  duration?: number;
  onOpenChange?: (
    event: WechatMiniprogram.CustomEvent<{ open: boolean }>,
  ) => void;
  onSelect?: (
    event: WechatMiniprogram.CustomEvent<ActionSheetSelectDetails>,
  ) => void;
  onAction?: (
    event: WechatMiniprogram.CustomEvent<ActionSheetActionDetails>,
  ) => void;
  onClose?: (event: WechatMiniprogram.CustomEvent) => void;
  onBackdropTap?: (event: WechatMiniprogram.CustomEvent) => void;
  onCloseTriggerTap?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiSwipeCellElementProps extends CuiCommonElementProps {
  ui?: SwipeCellUI;
  disabled?: boolean;
  opened?: SwipeCellProps["opened"];
  defaultOpened?: SwipeCellProps["defaultOpened"];
  left?: SwipeCellProps["left"];
  right?: SwipeCellProps["right"];
  leftWidth?: number;
  rightWidth?: number;
  threshold?: number;
  duration?: number;
  closeOnActionClick?: boolean;
  closeOnContentClick?: boolean;
  onOpenChange?: (
    event: WechatMiniprogram.CustomEvent<SwipeCellOpenChangeDetails>,
  ) => void;
  onOpen?: (
    event: WechatMiniprogram.CustomEvent<{ side: "left" | "right" }>,
  ) => void;
  onClose?: (event: WechatMiniprogram.CustomEvent) => void;
  onActionClick?: (
    event: WechatMiniprogram.CustomEvent<SwipeCellActionClickDetails>,
  ) => void;
  onClick?: (
    event: WechatMiniprogram.CustomEvent<SwipeCellActionClickDetails>,
  ) => void;
  onDragstart?: (event: WechatMiniprogram.CustomEvent) => void;
  onDrag?: (event: WechatMiniprogram.CustomEvent) => void;
  onDragend?: (event: WechatMiniprogram.CustomEvent) => void;
}
export interface CuiSliderElementProps extends CuiCommonElementProps {
  ui?: SliderUI;
  name?: string;
  value?: number | number[];
  defaultValue?: number | number[];
  min?: number;
  max?: number;
  step?: number;
  orientation?: SliderProps["orientation"];
  inverted?: boolean;
  minStepsBetweenThumbs?: number;
  color?: ThemeColor;
  size?: SliderSize;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  required?: boolean;
  label?: string;
  showValue?: boolean;
  marks?: SliderProps["marks"];
  onChange?: (
    event: WechatMiniprogram.CustomEvent<SliderChangeDetails>,
  ) => void;
  onChangeEnd?: (
    event: WechatMiniprogram.CustomEvent<SliderChangeDetails>,
  ) => void;
}

export interface CuiTabsElementProps extends CuiCommonElementProps {
  ui?: TabsUI;
  value?: TabsProps["value"];
  defaultValue?: TabsProps["defaultValue"];
  items?: TabsProps["items"];
  orientation?: TabsOrientation;
  variant?: TabsVariant;
  color?: TabsColor;
  size?: TabsSize;
  disabled?: boolean;
  loopFocus?: boolean;
  activationMode?: TabsProps["activationMode"];
  onChange?: (
    event: WechatMiniprogram.CustomEvent<TabsValueChangeDetails>,
  ) => void;
}

export interface CuiTabsItemElementProps extends CuiCommonElementProps {
  ui?: TabsItemUI;
  value?: TabsItemProps["value"];
  label?: string;
  icon?: string;
  trailingIcon?: string;
  badge?: string | number;
  disabled?: boolean;
  lazy?: boolean;
}

export interface CuiToastElementProps extends CuiCommonElementProps {
  ui?: ToastUI;
  mode?: ToastMode;
  color?: ToastColor;
  variant?: ToastVariant;
  orientation?: ToastOrientation;
  placement?: ToastPlacement;
  title?: string;
  description?: string;
  icon?: string;
  duration?: number;
  open?: boolean;
  close?: boolean | ToastCloseProps;
  actions?: ToastProps["actions"];
  progress?: boolean | { color?: string };
  onOpenChange?: (
    event: WechatMiniprogram.CustomEvent<{ open: boolean }>,
  ) => void;
  onDismiss?: (event: WechatMiniprogram.CustomEvent) => void;
  onAction?: (
    event: WechatMiniprogram.CustomEvent<{ action: any; index: number }>,
  ) => void;
}

export interface CuiFloatingMenuElementProps extends CuiCommonElementProps {
  ui?: FloatingMenuUI;
  open?: boolean | null;
  defaultOpen?: boolean;
  disabled?: boolean;
  closeOnBackdropClick?: boolean;
  triggerMode?: FloatingTriggerMode;
  portal?: boolean;
  arrow?: boolean;
  side?: FloatingSide;
  align?: FloatingAlign;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  avoidCollisions?: boolean;
  matchTriggerWidth?: FloatingMatchWidth;
  maxHeight?: number;
  duration?: number;
  onOpenChange?: (
    event: WechatMiniprogram.CustomEvent<FloatingMenuOpenChangeDetails>,
  ) => void;
  onOpen?: (event: WechatMiniprogram.CustomEvent) => void;
  onClose?: (event: WechatMiniprogram.CustomEvent) => void;
  onBackdropTap?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiSelectElementProps extends CuiCommonElementProps {
  ui?: SelectUI;
  name?: string;
  form?: string;
  rules?: FormRule[];
  validateOn?: FormValidateOn;
  mode?: SelectMode;
  value?: SelectValue;
  defaultValue?: SelectValue;
  open?: boolean | null;
  defaultOpen?: boolean;
  multiple?: boolean;
  items?: SelectItemsInput;
  valueKey?: string;
  labelKey?: string;
  descriptionKey?: string;
  disabledKey?: string;
  variant?: SelectVariant;
  color?: SelectColor;
  size?: SelectSize;
  highlight?: boolean;
  placeholder?: string;
  icon?: string;
  leading?: boolean;
  leadingIcon?: string;
  trailing?: boolean;
  trailingIcon?: string;
  selectedIcon?: string;
  clearIcon?: string;
  loading?: boolean;
  loadingIcon?: string;
  clearable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean | null;
  closeOnSelect?: boolean | null;
  closeOnBackdropClick?: boolean;
  portal?: boolean;
  arrow?: boolean;
  content?: SelectContentConfig;
  title?: string;
  cancelBtn?: string | boolean;
  confirmBtn?: string | boolean;
  header?: boolean;
  itemHeight?: number;
  emptyText?: string;
  duration?: number;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<SelectValueChangeDetails>,
  ) => void;
  onSelect?: (
    event: WechatMiniprogram.CustomEvent<SelectSelectDetails>,
  ) => void;
  onOpenChange?: (
    event: WechatMiniprogram.CustomEvent<SelectOpenChangeDetails>,
  ) => void;
  onConfirm?: (
    event: WechatMiniprogram.CustomEvent<SelectConfirmDetails>,
  ) => void;
  onCancel?: (
    event: WechatMiniprogram.CustomEvent<{ trigger?: string }>,
  ) => void;
  onColumnChange?: (
    event: WechatMiniprogram.CustomEvent<SelectColumnChangeDetails>,
  ) => void;
  onClear?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiSelectItemElementProps extends CuiCommonElementProps {
  ui?: SelectItemUI;
  type?: SelectItemType;
  value?: SelectScalarValue;
  label?: string;
  description?: string;
  icon?: string;
  trailingIcon?: string;
  disabled?: boolean;
  selected?: boolean | null;
  color?: SelectItemColor;
  size?: SelectItemSize;
  onSelect?: (
    event: WechatMiniprogram.CustomEvent<{ value: SelectScalarValue }>,
  ) => void;
}

