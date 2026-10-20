import type { ButtonProps } from "@code-ui/button";
import type { DrawerProps } from "@code-ui/drawer";
import type {
  FormErrorDetails,
  FormProps,
  FormRule,
  FormSubmitDetails,
  FormValidateOn,
  FormValidationResult,
} from "@code-ui/form";
import type {
  InputProps,
  InputValueChangeDetails,
} from "@code-ui/input";
import type {
  PinInputProps,
  PinInputValueChangeDetails,
  PinInputValueInvalidDetails,
} from "@code-ui/pin-input";
import type { SwitchProps } from "@code-ui/switch";
import type {
  TextareaProps,
  TextareaValueChangeDetails,
  TextareaLineChangeDetails,
} from "@code-ui/textarea";
import type { ThemeColor } from "@code-ui/core";

export interface CuiCommonElementProps {
  id?: string;
  class?: string;
  className?: string;
  style?: string | Record<string, any>;
  slot?: string;
  key?: string | number;
  children?: any;
}

export interface CuiButtonElementProps extends CuiCommonElementProps {
  ui?: ButtonProps["ui"];
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  loadingAuto?: boolean;
  autoResetDuration?: number;
  openType?: string;
  formType?: string;
  onTap?: (event?: any) => void;
  onClick?: (event?: any) => void;
  onGetPhoneNumber?: (event?: any) => void;
  onChooseAvatar?: (event?: any) => void;
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
  showHeader?: boolean;
  showFooter?: boolean;
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
  ui?: DrawerProps["ui"];
  open?: boolean;
  placement?: DrawerProps["placement"];
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

export interface CuiFormElementProps extends CuiCommonElementProps {
  ui?: FormProps["ui"];
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
  onSubmit?: (
    event: WechatMiniprogram.CustomEvent<FormSubmitDetails>,
  ) => void;
  onError?: (
    event: WechatMiniprogram.CustomEvent<FormErrorDetails>,
  ) => void;
  onValidate?: (
    event: WechatMiniprogram.CustomEvent<FormValidationResult>,
  ) => void;
  onReset?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiInputElementProps extends CuiCommonElementProps {
  ui?: InputProps["ui"];
  name?: string;
  validateOn?: FormValidateOn;
  invalid?: boolean;
  variant?: InputProps["variant"];
  color?: InputProps["color"];
  size?: InputProps["size"];
  highlight?: boolean;
  value?: string | number;
  defaultValue?: string | number;
  type?: InputProps["type"];
  password?: boolean;
  placeholder?: string;
  placeholderClass?: string;
  placeholderStyle?: string;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  clearIcon?: string;
  loading?: boolean;
  leading?: boolean;
  trailing?: boolean;
  leadingIcon?: string;
  trailingIcon?: string;
  autoFocus?: boolean;
  maxlength?: number;
  cursorSpacing?: number;
  confirmType?: InputProps["confirmType"];
  confirmHold?: boolean;
  cursor?: number;
  selectionStart?: number;
  selectionEnd?: number;
  adjustPosition?: boolean;
  holdKeyboard?: boolean;
  onChange?: (
    event: WechatMiniprogram.CustomEvent<InputValueChangeDetails>,
  ) => void;
  onFocus?: (
    event: WechatMiniprogram.CustomEvent<{ value: string }>,
  ) => void;
  onBlur?: (
    event: WechatMiniprogram.CustomEvent<{ value: string }>,
  ) => void;
  onConfirm?: (
    event: WechatMiniprogram.CustomEvent<{ value: string }>,
  ) => void;
  onClear?: (event: WechatMiniprogram.CustomEvent) => void;
}

export interface CuiPinInputElementProps extends CuiCommonElementProps {
  ui?: PinInputProps["ui"];
  label?: string;
  name?: string;
  validateOn?: FormValidateOn;
  invalid?: boolean;
  variant?: PinInputProps["variant"];
  color?: PinInputProps["color"];
  size?: PinInputProps["size"];
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

export interface CuiSwitchElementProps extends CuiCommonElementProps {
  ui?: SwitchProps["ui"];
  name?: string;
  value?: string;
  label?: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  color?: SwitchProps["color"];
  size?: SwitchProps["size"];
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
  ui?: TextareaProps["ui"];
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
  leading?: boolean;
  trailing?: boolean;
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
  variant?: TextareaProps["variant"];
  color?: TextareaProps["color"];
  size?: TextareaProps["size"];
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

